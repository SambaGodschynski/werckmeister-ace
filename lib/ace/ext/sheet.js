define(function (require, exports, module) {
    "use strict";
    var oop = require("../lib/oop");
    // defines the parent mode
    var TextMode = require("./text").Mode;
    var MatchingBraceOutdent = require("./matching_brace_outdent").MatchingBraceOutdent;

    // defines the language specific highlighters and folding rules
    var SheetHighlightRules = require("./sheet_highlight_rules").SheetHighlightRules;
    //var MyNewFoldMode = require("./folding/mynew").MyNewFoldMode;


    var Mode = function () {
        // set everything up
        this.HighlightRules = SheetHighlightRules;
        this.$outdent = new MatchingBraceOutdent();
        this.$background_tokenizer = null;
        //this.foldingRules = new MyNewFoldMode();
    };
    oop.inherits(Mode, TextMode);
    (function () {
        // configure comment start/end characters
        this.lineCommentStart = "--";
        //this.blockComment = { start: "/*", end: "*/" };

        // special logic for indent/outdent. 
        // By default ace keeps indentation of previous line
        this.getNextLineIndent = function (state, line, tab) {
            var indent = this.$getIndent(line);
            return indent;
        };

        this.checkOutdent = function (state, line, input) {
            return this.$outdent.checkOutdent(line, input);
        };

        this.autoOutdent = function (state, doc, row) {
            this.$outdent.autoOutdent(doc, row);
        };

    }).call(Mode.prototype);
    exports.Mode = Mode;
});