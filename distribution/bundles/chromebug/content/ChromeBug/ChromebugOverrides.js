/* See license.txt for terms of usage */


FBL.ns(function chromebug() { with (FBL) {

const Ci = Components.interfaces;
const nsIDOMDocumentXBL = Ci.nsIDOMDocumentXBL;
const inIDOMUtils = CCSV("@mozilla.org/inspector/dom-utils;1", "inIDOMUtils");

var ChromebugOverrides = {

    //****************************************************************************************
    // Overrides

    // Override FirebugChrome
    syncTitle: function()
    {
        window.document.title = "ChromeBug";
        if (window.Application)
            window.document.title += " in " + Application.name + " " +Application.version;
        if(FBTrace.DBG_CHROMEBUG)
            FBTrace.sysout("Chromebug syncTitle "+window.document.title+"\n");
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // Location interface provider for binding.xml panelFileList

    // Override Firebug.HTMLPanel.prototype
    getTreeWalker: function(node)
    {
        if (!this.treeWalker || this.treeWalker.currentNode !== node)
        {
            // Apparently you cannot reset the currentNode on this treeWalker
            //http://mxr.mozilla.org/comm-central/source/mozilla/extensions/inspector/resources/content/viewers/dom/dom.js#819
            this.treeWalker = CCIN("@mozilla.org/inspector/deep-tree-walker;1", "inIDeepTreeWalker");
            this.treeWalker.showAnonymousContent = true;
            this.treeWalker.showSubDocuments = true; // does not matter, we don't visit children, only siblings

            try
            {
                this.treeWalker.init(node, Components.interfaces.nsIDOMNodeFilter.SHOW_ALL);
            }
            catch(exc)
            {
                FBTrace.sysout("Falling back to DOM Tree walker, inIDeepTreeWalker in chromebug requires FF 3.6 or higher "+exc, exc);
                this.treeWalker = node.ownerDocument.createTreeWalker(
                        node, NodeFilter.SHOW_ALL, null, false);
            }
        }
        return this.treeWalker;
    },

    getFirstChild: function(node)
    {
        var child = this.getTreeWalker(node).firstChild();
        if (FBTrace.DBG_HTML)
            FBTrace.sysout("Chromebug getFirstChild("+FBL.getElementCSSSelector(node)+") = "+FBL.getElementCSSSelector(child));
        return child;
    },

    getNextSibling: function(node)
    {
        // the Mozilla XBL tree walker cannot be initialized then called for nextSibling.
        // So we have to go up one, hunt around in the children to find ourselves, then get the next sibling.

        if (node === null)
            return null;

        var nextSibling = null;
        if (this.treeWalker && this.treeWalker.currentNode === node)
            nextSibling = this.treeWalker.nextSibling();

        if (nextSibling === null)
        {
            var parent = this.getParentNode(node);
            if (parent)  // then we are not root,
            {
                // look for siblings by first finding ourselves in parent list
                var walker = this.getTreeWalker(parent);

                var child = walker.firstChild();
                while (child !== null && child !== node)
                    child = walker.nextSibling();

                if (child === null)   // then we did not find our selves in our parents children
                {
                    var tag = node.ownerDocument.location + "";
                    if (this.embeddedBrowserParents && this.embeddedBrowserParents[tag] === parent) // then we are an embedded browser
                    {
                         var walker = this.getTreeWalker(parent);
                         nextSibling = walker.firstChild();  // it's a lie we are repeating here.
                    }
                    else
                    {
                        FBTrace.sysout("Chromebug getNextSibling FAILS "+FBL.getElementCSSSelector(node)+" not a child of parent "+FBL.getElementCSSSelector(parent));
                    }
                }
                else
                {
                    nextSibling = walker.nextSibling();
                }

            }
            // else we are root and our nextSibling is null
        }
        if (FBTrace.DBG_HTML)
            FBTrace.sysout("Chromebug getNextSibling("+FBL.getElementCSSSelector(node)+") = "+FBL.getElementCSSSelector(nextSibling));
        return nextSibling;
    },


    getParentNode: function(node)
    {
        // the Mozilla XBL tree walker fails for parentNode
        var parent = inIDOMUtils.getParentForNode(node, true);
        if (FBTrace.DBG_HTML)
            FBTrace.sysout("Chromebug getParentNode("+FBL.getElementCSSSelector(node)+") = "+FBL.getElementCSSSelector(parent));
        return parent;
    },

    onInspectingMouseOver: function(event)
    {
        if (FBTrace.DBG_INSPECT)
           FBTrace.sysout("ChromebugOverride: onInspectingMouseOver event", event);
        this.inspectNode(event.originalTarget);
        cancelEvent(event);
    },

    // Override debugger
    supportsWindow: function(win)
    {
        try {
            var context = (win ? Firebug.Chromebug.getContextByGlobal(win) : null);

            if (context && context.globalScope instanceof Chromebug.ContainedDocument)
            {
                if (context.window.Firebug)  // Don't debug, let Firebug do it.
                    return false;
            }

            if (FBTrace.DBG_LOCATIONS)
                FBTrace.sysout("ChromeBugPanel.supportsWindow win.location.href: "+((win && win.location) ? win.location.href:"null")+ " context:"+context+"\n");
            this.breakContext = context;
            return !!context;
        }
        catch (exc)
        {
            FBTrace.sysout("ChromebugPanel.supportsWindow FAILS", exc);
            return false;
        }
    },

    // Override debugger
    supportsGlobal: function(global, frame)  // (set the breakContext and return true) or return false;
    {
        try {
            if (frame)
            {
                var fileName = normalizeURL(frame.script.fileName);
                if (fileName && Firebug.Chromebug.isChromebugURL(fileName))
                    return false;

                // global is the outermost scope
                var context = ChromebugOverrides.getContextByFrame(frame, global);
                context.jsDebuggerCalledUs = true;
            }
            this.breakContext = context;

            return !!context;
        }
        catch (exc)
        {
            if (FBTrace.DBG_ERRORS)
                FBTrace.sysout("supportsGlobal FAILS for "+safeGetWindowLocation(global)+" because: "+exc, exc);
        }

    },

    /*
     * Map the frame to a context
     * @param frame jsdIStackFrame
     * @param global option previously computed from FBS
     * @return a context
     */
    getContextByFrame: function(frame, global)
    {
        var context = null;
        if (frame && frame.isValid)
        {
            if (Firebug.Chromebug.isChromebugURL(frame.script.fileName))
                return null;

            if (!global)
                global = Firebug.Chromebug.getGlobalByFrame(frame);

            if (global)
            {
                var name = safeGetWindowLocation(global);
                if (Firebug.Chromebug.isChromebugURL(name)) // if the frame was compiled in chromebug, ignore it
                    return null;

                context = Firebug.Chromebug.getOrCreateContext(global, frame.script.fileName);
            }
        }
        else
        {
            throw new Error("no frame isValid");
        }
        if (context)
        {
            if (FBTrace.DBG_TOPLEVEL)
                FBTrace.sysout("getContextByFrame "+normalizeURL(frame.script.fileName)+": frame.scope gave existing context "+context.getName());
        }
        else
        {
             FBTrace.sysout("getContextByFrame "+normalizeURL(frame.script.fileName)+": no context!");
        }
        return context;
    },

    showThisCompilationUnit: function(compilationUnit)
    {
        if (compilationUnit.getKind() === CompilationUnit.EVAL && !this.showEvals)
            return false;

        if (compilationUnit.getKind() === CompilationUnit.BROWSER_GENERATED && !this.showEvents)
            return false;

        var description = Chromebug.parseURI(compilationUnit.getURL());

        if (Firebug.Chromebug.allFilesList.isWantedDescription(description))
            return true;
        else
            return false;
    },

    //Firebug.SourceFile.getSourceFileByScript
    _getSourceFileByScript: Firebug.SourceFile.getSourceFileByScript,
    getSourceFileByScript: function(context, script)
    {
        var sourceFile = ChromebugOverrides._getSourceFileByScript( context, script );
        if (!sourceFile)
        {
            // Hack to workaround some enumerateScript bugs
            sourceFile = context.sourceFileMap[script.fileName];
            if (sourceFile && sourceFile.compilation_unit_type === "enumerated")
            {
                sourceFile.innerScripts[script.tag] = script;
                return sourceFile;
            }

            sourceFile = Firebug.Chromebug.eachContext(function visitContext(context)
            {
                var rc = ChromebugOverrides._getSourceFileByScript( context, script );
                if (rc)
                    return rc;
            });
        }
        return sourceFile;
    },

    // Override
    // Override FBL
    getBrowserForWindow: function(win)
    {
        var browsers = Firebug.Chromebug.getBrowsers();
        for (var i=0; i < browsers.length; ++i)
        {
            var browser = browsers[i];
            if (browser.contentWindow == win)
                return browser;
        }
    },

    skipSpy: function(win)
    {
        var uri = win.location.href; // don't attach spy to chromebug
        if (uri &&  uri.indexOf("chrome://chromebug") == 0)
                return true;
    },

    isHostEnabled: function(context)
    {
        return true; // Chromebug is always enabled for now
    },

    isAlwaysEnabled: function(context)
    {
        return true; // Chromebug is always enabled for now
    },

    suspendFirebug: function()
    {
        // TODO if possible.
        if (FBTrace.DBG_CHROMEBUG)
            FBTrace.sysout("ChromebugPanel.suspendFirebug\n");
    },

    resumeFirebug: function()
    {
        // TODO if possible.
        if (FBTrace.DBG_CHROMEBUG)
            FBTrace.sysout("ChromebugPanel.resumeFirebug\n");
    },

    tagBase: 1,
    tags:[],

    getTabIdForWindow: function(win)
    {
        if (! (win instanceof Ci.nsIDOMWindow) )  // eg net.js getWindowForRequest gives null
            return null;

        var tab = Firebug.getTabForWindow(win);
        if (tab)
            return tab.linkedPanel;

        if (!win.chromebugTag)
            win.chromebugTag = ChromebugOverrides.tagBase++;
        if (win.chromebugTag)
            return win.chromebugTag;

        if (FBTrace.DBG_CHROMEBUG)
            FBTrace.sysout("ChromebugOverrides.getTabIdForWindow no id ", win);
    },

    // Override Firebug.disableXULWindow
    disableXULWindow: function()
    {
        // no op, ignore the call
    },

    // Override FBTestApp.TestResultTabView.onClickStackFrame
    FBTestIntegrate_onSourceLinkClicked: function(elementClicked, url, lineNumber)
    {
        try
        {
            FBTrace.sysout("FBTestIntegrate_onSourceLinkClicked "+url+"@"+lineNumber);
            var context = Firebug.Chromebug.eachContext(function visitContext(context)
            {
                if (context.sourceFileMap[url])
                    return context;
            });
            if (context)
                Firebug.Chromebug.selectContext(context);
            else
                FBTrace.sysout("FBTestIntegrate_onSourceLinkClicked NO context for  "+url);

            var sourceLink = new FBL.SourceLink(url, lineNumber, "js");
            Firebug.chrome.select(sourceLink);
        }
        catch(exc)
        {
            FBTrace.sysout("FBTestIntegrate_onSourceLinkClicked FAILED "+exc, exc);
        }
    },
};

ChromebugOverrides.commandLine = {

        isAttached: function(context)
        {
            if (FBTrace.DBG_CHROMEBUG)
                FBTrace.sysout("ChromebugOverride isAttached for "+context.window, context.window);
            return context && context.window && context.window._FirebugCommandLine;
        },

        evaluate: function(expr, context, thisValue, targetWindow, successConsoleFunction, exceptionFunction)
        {
            if (FBTrace.DBG_CHROMEBUG)
                FBTrace.sysout('ChromebugOverrides.commandLine context.window '+context.window.location+" targetWindow "+targetWindow);

            var halter = context.window.document.getElementById("chromebugHalter");
            if (halter)
                context.window.document.removeElement(halter);

            halter = addScript(context.window.document, "chromebugHalter", "debugger;");
            /*
            Firebug.Debugger.halt(function evaluateInAFrame(frame)
            {
                context.currentFrame = frame;
                FBTrace.sysout("ChromebugOverrides.commandLine halted", frame);

                Firebug.CommandLine.evaluateInDebugFrame(expr, context, thisValue, targetWindow, successConsoleFunction, exceptionFunction);
            });
            */
        },
        onCommandLineFocus: function(event)
        {
                if (FBTrace.DBG_CONSOLE)
                    FBTrace.sysout("onCBCommandLineFocus", event);
                // do nothing.
                event.stopPropagation();
        },
}
//**************************************************************************
function overrideFirebugFunctions()
{
    try {
        // Apply overrides
        top.Firebug.prefDomain = "extensions.chromebug";
        //top.Firebug.chrome.getLocationProvider = ChromebugOverrides.getLocationProvider;
        top.Firebug.chrome.getBrowsers = bind(Firebug.Chromebug.getBrowsers, Firebug.Chromebug);
        top.Firebug.chrome.getCurrentBrowser = bind(Firebug.Chromebug.getCurrentBrowser, Firebug.Chromebug);
        top.Firebug.chrome.getCurrentURI = bind(Firebug.Chromebug.getCurrentURI, Firebug.Chromebug);

        // We set context on user control only
        ChromebugOverrides.firebugSetFirebugContext = top.Firebug.chrome.setFirebugContext;
        top.Firebug.chrome.setFirebugContext = function(context)
        {
            if (!context)
            {
                var context = Firebug.Chromebug.contextList.getDefaultLocation();
                Firebug.Chromebug.selectContext(context);

                if (FBTrace.DBG_CHROMEBUG)
                    FBTrace.sysout("setFirebugContext NULL set to "+(context?context.getName():"NULL"));
            }
            else
            {
                if (FBTrace.DBG_CHROMEBUG)
                    FBTrace.sysout("setFirebugContext NO-OP for "+(context?context.getName():"NULL"));
            }
        }

        // We don't want the context to show as windows load in Chromebug. Instead we wait for the user to select one.
        Firebug.Chromebug.firebugShowContext = Firebug.showContext;
        Firebug.showContext = function(browser, context)
        {
            if (FBTrace.DBG_CHROMEBUG)
                FBTrace.sysout("Chromebug skips showContext ");
        }

        Firebug.Chromebug.chromeSelect = Firebug.chrome.select;
        Firebug.chrome.select = function(object, panelName, sidePanelName, forceUpdate)
        {
            // Some objects need to cause context changes.
            if (object instanceof StackFrame)
            {
                var context = object.context;
                if (context != Firebug.currentContext)
                    Firebug.Chromebug.selectContext(context);
            }
            else if (object instanceof Ci.jsdIStackFrame)
            {
                FBTrace.sysout("select, object is jsdIStackFrame!", object);
                var context = ChromebugOverrides.getContextByFrame(object);
                if (context != Firebug.currentContext)
                    Firebug.Chromebug.selectContext(context);
            }
            Firebug.Chromebug.chromeSelect.apply(Firebug.chrome,[object, panelName, sidePanelName, forceUpdate])
        };


        Firebug.Chromebug.firebugSyncResumeBox = Firebug.syncResumeBox;
        top.Firebug.syncResumeBox = function(context)
        {
            if (context) Firebug.Chromebug.firebugSyncResumeBox(context);
        }

        top.Firebug.chrome.syncTitle = ChromebugOverrides.syncTitle;

        top.Firebug.Inspector.FrameHighlighter.prototype.doNotHighlight = function(element)
        {
             return false;
        };

        top.Firebug.HTMLLib.ElementWalker.prototype.getTreeWalker = ChromebugOverrides.getTreeWalker;
        top.Firebug.HTMLPanel.prototype.getTreeWalker             = ChromebugOverrides.getTreeWalker;

        top.Firebug.HTMLLib.ElementWalker.prototype.getFirstChild = ChromebugOverrides.getFirstChild;
        top.Firebug.HTMLPanel.prototype.getFirstChild             = ChromebugOverrides.getFirstChild;

        top.Firebug.HTMLLib.ElementWalker.prototype.getNextSibling = ChromebugOverrides.getNextSibling;
        top.Firebug.HTMLPanel.prototype.getNextSibling             = ChromebugOverrides.getNextSibling;

        top.Firebug.HTMLLib.ElementWalker.prototype.getParentNode = ChromebugOverrides.getParentNode;
        top.Firebug.HTMLPanel.prototype.getParentNode             = ChromebugOverrides.getParentNode;

        top.Firebug.Inspector.onInspectingMouseOver = ChromebugOverrides.onInspectingMouseOver;

        top.Firebug.Debugger.supportsWindow = ChromebugOverrides.supportsWindow;
        top.Firebug.Debugger.supportsGlobal = ChromebugOverrides.supportsGlobal;
        top.Firebug.Debugger.breakNowURLPrefix = "chrome://fb4cb/",
        top.Firebug.Debugger.getContextByFrame = ChromebugOverrides.getContextByFrame;
        top.Firebug.ScriptPanel.prototype.showThisCompilationUnit = ChromebugOverrides.showThisCompilationUnit;
        top.Firebug.SourceFile.getSourceFileByScript = ChromebugOverrides.getSourceFileByScript;

        top.Firebug.showBar = function() {
            if (FBTrace.DBG_CHROMEBUG)
                FBTrace.sysout("ChromeBugPanel.showBar NOOP\n");
        }

        Firebug.Spy.skipSpy = ChromebugOverrides.skipSpy;
        Firebug.ActivableModule.isHostEnabled = ChromebugOverrides.isHostEnabled;
        Firebug.ActivableModule.isAlwaysEnabled = ChromebugOverrides.isAlwaysEnabled;
        Firebug.suspendFirebug = ChromebugOverrides.suspendFirebug;
        Firebug.resumeFirebug = ChromebugOverrides.resumeFirebug;

        top.Firebug.getTabIdForWindow = ChromebugOverrides.getTabIdForWindow;
        top.Firebug.disableXULWindow = ChromebugOverrides.disableXULWindow;
        FBL.getBrowserForWindow = ChromebugOverrides.getBrowserForWindow;

        for (var p in Chromebug.Activation)
            Firebug.Activation[p] = Chromebug.Activation[p];

        Firebug.getContextType = function getChromebugContextType()
        {
            return Chromebug.DomWindowContext;
        };


        Firebug.TraceModule.getTraceConsoleURL =  function getChromebugTraceConsoleURL()
        {
            return "chrome://fb4cb/content/traceConsole.xul";
        };


        FBL.getRootWindow = function(win) { return win; };

        //Firebug.CommandLine.evaluate = ChromebugOverrides.commandLine.evaluate;
        //Firebug.CommandLine.onCommandLineFocus = ChromebugOverrides.commandLine.onCommandLineFocus;
        Firebug.CommandLine.isAttached = ChromebugOverrides.commandLine.isAttached;
        // Trace message coming from Firebug should be displayed in Chromebug's panel
        //
        //Firebug.setPref("extensions.firebug", "enableTraceConsole", "panel");

        try
        {
            Components.utils.import("resource://fbtest/FBTestIntegrate.js")
            FBTestIntegrate.onSourceLinkClicked = ChromebugOverrides.FBTestIntegrate_onSourceLinkClicked;
        }
        catch(eIntegrate)
        {
            FBTrace.sysout("FBTestIntegrate_onSourceLinkClicked override FAILED "+eIntegrate);
        }

        window.dump("ChromebugPanel Overrides applied"+"\n");
    }
    catch(exc)
    {
        window.dump("ChromebugPanel override FAILS "+exc+"\n");
    }
}

function echo(header, elt)
{
    if (FBTrace.DBG_HTML && elt)
        FBTrace.sysout(header + (elt ? elt.localName:"null")+"\n");
    return elt;
}
// TODO make this FBL or chrome . functions
function panelSupportsObject(panelType, object)
{
    if (panelType)
    {
        try {
            // This tends to throw exceptions often because some objects are weird
            return panelType.prototype.supportsObject(object)
        } catch (exc) {}
    }

    return 0;
}

//*************************************************************************************************
// Override Firebug.Activation module logic

Chromebug.Activation =
{
    initialize: function()
    {
    },

    allOff: function()
    {

    },

    updateAllPagesActivation: function()
    {

    },

    shouldCreateContext: function(browser, url, userCommands)
    {
        FBTrace.sysout("Chromebug.Activation "+url+" browser "+(browser ? browser.getAttribute('id') :"(no browser)"), browser);
        return !Firebug.Chromebug.isChromebugURL(url);
    },

    shouldShowContext: function(context)
    {
        // Don't show chromebug's own windows.
        if (context && context.window && context.window instanceof Ci.nsIDOMWindow)
            return !Firebug.Chromebug.isChromebugURL(context.getName());
        else
            return true;  // show non-window contexts
    }
};

overrideFirebugFunctions();
}});