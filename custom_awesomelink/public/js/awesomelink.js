'use strict';

/** Custom input field for Frappe Framework using Awesomplete. */
class AwesomeLink {
    /** Constructor!!!. 
     * @param {object} frm 
     * - frm object from Frappe Framework
     * @param {text} field 
     * - field name in doctype
     * - field='withholdee',
     * @param {text} label 
     * - label name for new field
     * - label='ผู้ถูกหักภาษี',
     * @param {dict} choice 
     * - dictionary of choice 'lable' and 'value'
     * - choice=[
     *     {
     *         'lable': '0226672009956 - บจก.ฐาปนา16',
     *         'value': 'บจก.ฐาปนา16',
     *         'id': '13c5b2163f',
     *     },
     *     {
     *         'lable': '0115561008845 - บจก.สเปซโค้ด',
     *         'value': 'บจก.สเปซโค้ด',
     *         'id': 'f4c9899dfa',
     *     },
     * ],
    */
    constructor(frm, field, label, choice) {
        this.frm=frm;
        this.field = field;
        this.label = label;
        this.choice = choice;

        this.getInputHtml();
        this.insertInput();
        this.attatchInput();
        this.updateOriFieldWhenSelected();
        this.autoSel();
    }

    /**
     * @return {text} will use to insert input field
    */
    getInputHtml() {
        this.html = `
        <form>
            <div class="frappe-control input-max-width">
                <div class="form-group">
                    <div class="clearfix">
                        <label class="control-label" 
                        style="padding-right: 0px;">`
                            + this.label +
                        `</label>
                    </div>
                    <div class="control-input-wrapper">
                        <div class="control-input">
                            <input type="text" autocomplete="off" id="myinput"
                                class="input-with-feedback form-control bold" 
                                maxlength="140" placeholder="" data-fieldname="`
                                + 'search_' + this.field + `"
                                >
                        </div>
                    </div>
                </div>
            </div>
        </form>
        `;
        return this.html;
    }

    /** Insert custom input field after original link input field */
    insertInput() {
        this.oriField = $('[data-fieldname='+this.field+']').parent('form');
        $(this.html).insertBefore(this.oriField);
        this.cusField = $('[data-fieldname="search_'+field+'"]')[0];
    }

    /** Attatch Awesomplete to custom input field */
    attatchInput() {
        this.aweField = new Awesomplete(this.cusField, {
            minChars: 1,
            maxItems: 20,
            list: this.choice,
            autoFirst: true,
        });
    }

    /** Add event listener to custom input field 
     * @param {text} type - event type
     * @param {function} func - function ran when event is triggered
    */
    addEventLis(type, func) {
        this.cusField.addEventListener(
            type, func
        );
    }

    /** update original field with id  
     * @param {text} id 
     * - name of DocType
     * - label='13c5b2163f',
    */
   updateOriFieldWhenSelected() {
        this.addEventLis(
            'awesomplete-selectcomplete',
            function(e) {
                let id = this.searchField(e.text.value);
                this.updateOriField(id);
            }.bind(this)
        );
    }

    /** search id of values field in choice
     * @param {text} value 
     * - 'value' key from choice dict
     * @return {text} id
    */
    searchField(value) {
        let id = '';
        $.each(this.choice, function(i, v) {
            if (v.value===value) {
                id = v.id;
            }
        });
        return id;
    }

    /** update original field with id  
     * @param {text} id 
     * - name of DocType
     * - label='13c5b2163f',
    */
    updateOriField(id) {
        this.id = id;
        this.frm.doc[this.field] = this.id;
        refresh_field(this.field);
    }

    /** Autoselect value if there is only one choice */
    autoSel() {
        if (this.choice.length===1) {
            this.aweField.replace(this.choice[0]);
            this.updateOriField(this.choice[0].id);
        }
    }
}