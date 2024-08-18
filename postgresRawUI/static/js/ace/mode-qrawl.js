ace.define("ace/mode/qrawl_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

var QrawlHighlightRules = function() {

    var keywords = (
        "select|distinct|from|where|group|by|having|in|union|order|desc|asc|" +
        "if|then|else|parse|parse?|into|not|and|or|flatten|like|" +
        "as|as?|all|cast|partition|on|error|fail|skip|isnull|isnone|collection"
        //+"|bool|record|collection|long|float|int|option|string|regex"
    );

    var builtinConstants = (
        "true|false|null|none"
    );



    var builtinFunctions = (
        "avg|count|exists|max|min|min?|max?|sum|trim|startswith|strempty|"+
        "strtodate|strtodate?|strtotime|strtotime?|strtotimestamp|strtotimestamp?"
    );

    var keywordMapper = this.createKeywordMapper({
        "support.function": builtinFunctions,
        "keyword": keywords,
        "constant.language": builtinConstants,
    }, "identifier", true);

    this.$rules = {
        "start" : [ {
            token : "comment",
            regex : "//.*$"
        }, {
            token : "string",           // " string
            regex : '".*?"'
        }, {
            token : "string",           // ' string
            regex : "'.*?'"
        }, {
            token : "constant.numeric", // float
            regex : "[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?\\b"
        }, {
            token : keywordMapper,
            regex : "[a-zA-Z_$][a-zA-Z0-9_$]*\\b"
        }, {
            token : "keyword.operator",
            regex : "\\+|\\-|\\/|\\/\\/|%|<@>|@>|<@|&|\\^|~|<|>|<=|=>|==|!=|<>|="
        }, {
            token : "paren.lparen",
            regex : "[\\(\\[\\{]"
        }, {
            token : "paren.rparen",
            regex : "[\\)\\]\\}]"
        }, {
            token : "text",
            regex : "\\s+"
        } ]
    };
    this.normalizeRules();
};

oop.inherits(QrawlHighlightRules, TextHighlightRules);

exports.QrawlHighlightRules = QrawlHighlightRules;
});

ace.define("ace/mode/qrawl",["require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/qrawl_highlight_rules","ace/range"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var TextMode = require("./text").Mode;
var QrawlHighlightRules = require("./qrawl_highlight_rules").QrawlHighlightRules;
var Range = require("../range").Range;

var Mode = function() {
    this.HighlightRules = QrawlHighlightRules;
};
oop.inherits(Mode, TextMode);

(function() {

    this.lineCommentStart = "--";

    this.$id = "ace/mode/qrawl";
}).call(Mode.prototype);

exports.Mode = Mode;

});
