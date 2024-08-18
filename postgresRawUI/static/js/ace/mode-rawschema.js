ace.define("ace/mode/rawschema_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

var RawSchemalHighlightRules = function() {

    var keywords = (
        "string|int|long|float|double|string|bool|date|time|datetime|timestamp|"+
        "collection|record|option|any"
    );

    var builtinConstants = (
        ""
    );

    var builtinFunctions = (
        ""
    );

    var keywordMapper = this.createKeywordMapper({
        "support.function": builtinFunctions,
        "keyword": keywords,
        "constant.language": builtinConstants,
    }, "identifier", true);

    this.$rules = {
        "start" : [{
            token : "string",           // ' string
            regex : "[a-zA-Z_$][a-zA-Z0-9_$]+\\s*:"
        }, {
            token : keywordMapper,
            regex : "[a-zA-Z_$][a-zA-Z0-9_$]*\\b"
        }, {
            token : "paren.lparen",
            regex : "[\\(]"
        }, {
            token : "paren.rparen",
            regex : "[\\)]"
        }, {
            token : "text",
            regex : "\\s+"
        } ]
    };
    this.normalizeRules();
};

oop.inherits(RawSchemalHighlightRules, TextHighlightRules);

exports.RawSchemalHighlightRules = RawSchemalHighlightRules;
});

ace.define("ace/mode/rawschema",["require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/rawschema_highlight_rules","ace/range"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var TextMode = require("./text").Mode;
var RawSchemalHighlightRules = require("./rawschema_highlight_rules").RawSchemalHighlightRules;
var Range = require("../range").Range;

var Mode = function() {
    this.HighlightRules = RawSchemalHighlightRules;
};
oop.inherits(Mode, TextMode);

(function() {

    //this.lineCommentStart = "--";

    this.$id = "ace/mode/rawschema";
}).call(Mode.prototype);

exports.Mode = Mode;

});
