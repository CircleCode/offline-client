CREATE TABLE  IF NOT EXISTS "transactionPolicies" (
  "name"                TEXT NOT NULL PRIMARY KEY ON CONFLICT REPLACE,
  "description"         TEXT
);

INSERT INTO transactionPolicies(name,description) VALUES("one", "Autoriser la synchronisation unitaire");
INSERT INTO transactionPolicies(name,description) VALUES("global","Synchronisation globale seulement");

CREATE TABLE  IF NOT EXISTS "domainModes" (
  "name"                TEXT NOT NULL PRIMARY KEY ON CONFLICT REPLACE,
  "description"         TEXT
);

INSERT INTO domainModes(name,description) VALUES("standard", "Standard");
INSERT INTO domainModes(name,description) VALUES("advanced","Advanced");

CREATE TABLE  IF NOT EXISTS "sharePolicies" (
  "name"                TEXT NOT NULL PRIMARY KEY ON CONFLICT REPLACE,
  "description"         TEXT
);

INSERT INTO sharePolicies(name,description) VALUES("none", "Pas de partage");
INSERT INTO sharePolicies(name,description) VALUES("admin","Limité aux administrateurs");
INSERT INTO sharePolicies(name,description) VALUES("users","Modifiable par tous");

CREATE TABLE  IF NOT EXISTS "domains" (
  "id"                  INTEGER NOT NULL PRIMARY KEY ON CONFLICT REPLACE ,
  "name"                TEXT NOT NULL ,
  "description"         TEXT ,
  "mode"                TEXT NOT NULL REFERENCES domainModes("name") ,
  "transactionPolicies" TEXT NOT NULL REFERENCES transactionPolicies("name") ,
  "sharePolicies"       TEXT NOT NULL REFERENCES sharePolicies("name") ,
  "iAmAdmin"            BOOLEAN NOT NULL DEFAULT FALSE
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
    "editable"          BOOLEAN DEFAULT FALSE,

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
    "lastsyncremote"    DATETIME_TEXT,
    "lastsynclocal"     DATETIME_TEXT,
    "lastsavelocal"     DATETIME_TEXT,

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
    "type"              TEXT NOT NULL
);