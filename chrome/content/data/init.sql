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
    "iamadmin"          BOOLEAN NOT NULL DEFAULT FALSE,
    "lastsyncremote"    DATETIME_TEXT DEFAULT NULL,

    PRIMARY KEY ("id") ON CONFLICT REPLACE
);

CREATE TABLE IF NOT EXISTS "families" (
    "famid"             INTEGER NOT NULL,
    "name"              TEXT NOT NULL,
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

    PRIMARY KEY ("initid", "domainid") ON CONFLICT REPLACE
);

CREATE TABLE IF NOT EXISTS "attrmappings" (
    "famid"             INTEGER NOT NULL REFERENCES families("famid") ON UPDATE CASCADE,
    "attrid"            TEXT NOT NULL,
    "columnid"          TEXT NOT NULL ,
    "ismultiple"        BOOLEAN NOT NULL DEFAULT FALSE,
    "isproperty"        BOOLEAN NOT NULL DEFAULT FALSE,
    "type"              TEXT NOT NULL,

    PRIMARY KEY ("famid", "attrid") ON CONFLICT REPLACE
);

CREATE TABLE IF NOT EXISTS "enums" (
    "famid"             INTEGER NOT NULL REFERENCES families("famid") ON UPDATE CASCADE,
    "attrid"            TEXT NOT NULL REFERENCES attrmappings("attrid") ON UPDATE CASCADE,
    "key"               TEXT NOT NULL,
    "value"             TEXT NOT NULL,

    PRIMARY KEY ("famid", "attrid") ON CONFLICT REPLACE
);

CREATE TABLE IF NOT EXISTS "doctitles" (
    "famid"             INTEGER NOT NULL REFERENCES families("famid") ON UPDATE CASCADE,
    "initid"            INTEGER NOT NULL REFERENCES documents("initid") ON UPDATE CASCADE,
    "title"             TEXT NOT NULL,
    
    PRIMARY KEY ("initid") ON CONFLICT REPLACE
);

CREATE TABLE IF NOT EXISTS "files" (
    "initid"            INTEGER NOT NULL REFERENCES documents("initid") ON UPDATE CASCADE,
    "attrid"            TEXT NOT NULL REFERENCES attrmappings("attrid") ON UPDATE CASCADE,
    "index"             INTEGER,
    "basename"          TEXT NOT NULL,
    "path"              TEXT NOT NULL,
    "writable"          BOOLEAN NOT NULL DEFAULT FALSE,
    
    PRIMARY KEY ("initid", "attrid", "index") ON CONFLICT REPLACE
);