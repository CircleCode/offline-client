DROP TABLE IF EXISTS transactionpolicies;
DROP TABLE IF EXISTS domainmodes;
DROP TABLE IF EXISTS sharepolicies;
DROP TABLE IF EXISTS domains;
DROP TABLE IF EXISTS families;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS templates;
DROP TABLE IF EXISTS synchrotimes;
DROP TABLE IF EXISTS docsbydomain;
DROP TABLE IF EXISTS attrmappings;
DROP TABLE IF EXISTS enums;
DROP TABLE IF EXISTS doctitles;
DROP TABLE IF EXISTS files;

CREATE TABLE  IF NOT EXISTS "transactionpolicies" (
    "name"              TEXT NOT NULL,
    "description"       TEXT,

    PRIMARY KEY ("name") ON CONFLICT REPLACE
);

INSERT INTO transactionpolicies(name,description) VALUES("one", "Autoriser la synchronisation unitaire");
INSERT INTO transactionpolicies(name,description) VALUES("global","Synchronisation globale seulement");
INSERT INTO transactionpolicies(name,description) VALUES("partial","Synchronisation partielle");

CREATE TABLE  IF NOT EXISTS "domainmodes" (
    "name"              TEXT NOT NULL,
    "description"       TEXT,

    PRIMARY KEY ("name") ON CONFLICT REPLACE
);

INSERT INTO domainmodes(name,description) VALUES("standard", "Standard");
INSERT INTO domainmodes(name,description) VALUES("advanced","Advanced");

CREATE TABLE  IF NOT EXISTS "sharepolicies" (
    "name"              TEXT NOT NULL,
    "description"       TEXT,

    PRIMARY KEY ("name") ON CONFLICT REPLACE
);

INSERT INTO sharepolicies(name,description) VALUES("none", "Pas de partage");
INSERT INTO sharepolicies(name,description) VALUES("admin","Limité aux administrateurs");
INSERT INTO sharepolicies(name,description) VALUES("users","Modifiable par tous");

CREATE TABLE  IF NOT EXISTS "domains" (
    "id"                INTEGER NOT NULL,
    "name"              TEXT NOT NULL,
    "description"       TEXT,
    "mode"              TEXT NOT NULL REFERENCES domainmodes("name"),
    "transactionpolicy" TEXT NOT NULL REFERENCES transactionpolicies("name"),
    "sharepolicy"       TEXT NOT NULL REFERENCES sharepolicies("name"),
    "lastsyncremote"    DATETIME DEFAULT NULL,

    PRIMARY KEY ("id") ON CONFLICT REPLACE
);

CREATE TABLE IF NOT EXISTS "families" (
    "famid"             INTEGER NOT NULL,
    "name"              TEXT NOT NULL,
    "title"             TEXT,
    "icon"             TEXT,
    "json_object"       TEXT,
    "creatable"         BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY ("famid") ON CONFLICT REPLACE
);

CREATE TABLE IF NOT EXISTS "documents" (
    "initid"            INTEGER NOT NULL,
    "name"              TEXT,
    "title"             TEXT NOT NULL,
    "fromid"            TEXT NOT NULL REFERENCES families("famid") ON UPDATE CASCADE,
    "fromname"          TEXT NOT NULL REFERENCES families("name") ON UPDATE CASCADE,

    PRIMARY KEY ("initid") ON CONFLICT REPLACE
);

CREATE TABLE IF NOT EXISTS "templates" (
    "initid"            INTEGER NOT NULL REFERENCES documents("initid") ON UPDATE CASCADE,
    "viewtemplate"      TEXT,
    "edittemplate"      TEXT,

    PRIMARY KEY ("initid") ON CONFLICT REPLACE
);

CREATE TABLE IF NOT EXISTS "synchrotimes" (
    "initid"            INTEGER NOT NULL REFERENCES documents("initid") ON UPDATE CASCADE,
    "lastsyncremote"    DATETIME,
    "lastsynclocal"     DATETIME,
    "lastsavelocal"     DATETIME,

    PRIMARY KEY ("initid") ON CONFLICT REPLACE
);

CREATE TABLE IF NOT EXISTS "docsbydomain" (
    "initid"            INTEGER NOT NULL REFERENCES documents("initid") ON UPDATE CASCADE,
    "domainid"          INTEGER NOT NULL REFERENCES domains("id") ON UPDATE CASCADE,
    "editable"          BOOLEAN NOT NULL DEFAULT false,
    "isshared"          BOOLEAN ,
    "isusered"          BOOLEAN ,

    PRIMARY KEY ("initid", "domainid") ON CONFLICT REPLACE
);

CREATE TABLE IF NOT EXISTS "attrmappings" (
    "famid"             INTEGER NOT NULL REFERENCES families("famid") ON UPDATE CASCADE,
    "attrid"            TEXT NOT NULL,
    "columnid"          TEXT NOT NULL ,
    "label"             TEXT,
    "isabstract"        BOOLEAN NOT NULL DEFAULT FALSE,
    "istitle"           BOOLEAN NOT NULL DEFAULT FALSE,
    "ismultiple"        BOOLEAN NOT NULL DEFAULT FALSE,
    "isproperty"        BOOLEAN NOT NULL DEFAULT FALSE,
    "type"              TEXT NOT NULL,

    PRIMARY KEY ("famid", "attrid") ON CONFLICT REPLACE
);

CREATE TABLE IF NOT EXISTS "enums" (
    "famid"             INTEGER NOT NULL REFERENCES families("famid") ON UPDATE CASCADE,
    "attrid"            TEXT NOT NULL REFERENCES attrmappings("attrid") ON UPDATE CASCADE,
    "key"               TEXT NOT NULL,
    "label"             TEXT NOT NULL,

    PRIMARY KEY ("famid", "attrid", "key") ON CONFLICT REPLACE
);

CREATE TABLE IF NOT EXISTS "doctitles" (
  --  "famid"             INTEGER, -- REFERENCES families("famid") ON UPDATE CASCADE
    "famname"           TEXT,  
    "initid"            INTEGER NOT NULL REFERENCES documents("initid") ON UPDATE CASCADE,
    "title"             TEXT NOT NULL,
    
    PRIMARY KEY ("initid") ON CONFLICT REPLACE
);

CREATE TABLE IF NOT EXISTS "files" (
    "initid"            INTEGER NOT NULL REFERENCES documents("initid") ON UPDATE CASCADE,
    "attrid"            TEXT NOT NULL REFERENCES attrmappings("attrid") ON UPDATE CASCADE,
    "index"             TEXT,
    "basename"          TEXT NOT NULL,
    "path"              TEXT NOT NULL,
    "serverid"          TEXT,
    "writable"          BOOLEAN NOT NULL DEFAULT FALSE,
    "recorddate"        DATETIME,
    "modifydate"        DATETIME,
    
    PRIMARY KEY ("initid", "attrid", "index") ON CONFLICT REPLACE
);