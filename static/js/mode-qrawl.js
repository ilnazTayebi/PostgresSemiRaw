ace.define("ace/mode/qrawl_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

var QrawlHighlightRules = function() {

    var keywords = (
        "select|distinct|parse|into|from|where|and|or|group|by|order|limit|having|as|in|" +
        "else|desc|asc|union|if|" +
        "not|" +
        "for|yield|" +
        "partition"
    );

    var builtinConstants = (
        "true|false|null"
    );

    var builtinFunctions = (
        "avg|count|first|last|max|min|sum|ucase|lcase|mid|len|round|rank|now|format|" + 
        "coalesce|ifnull|isnull|nvl|list|bag|set"
    );

    var keywordMapper = this.createKeywordMapper({
        "support.function": builtinFunctions,
        "keyword": keywords,
        "constant.language": builtinConstants,
    }, "identifier", true);

    this.$rules = {
        "start" : [ {
            token : "comment",
            regex : "--.*$"
        },  {
            token : "comment",
            regex : "//.*$"
        },
            {
            token : "comment",
            start : "/\\*",
            end : "\\*/"
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
