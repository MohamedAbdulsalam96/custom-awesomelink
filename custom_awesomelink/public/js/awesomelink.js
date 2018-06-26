'use strict';

/** Custom input field for Frappe Framework using Awesomplete. */
class AwesomeLink {
    /** Create new awesomplete input box above old link field
     * @param {dict} args 
     * Mandatory
     * - frm {object}: frm object from Frappe Framework
     * - field {text}: subject field name in form
     * 
     * Optional
     * - label {text}: label name for subject field
     * - labelRe {text}: choice label template will use to create choice
     * - valueRe {text}: choice value template will use to create choice
     * - choice {dict}: dictionary of choice 'lable', 'value', 'id'
     * - setUpChoice {bool}
    */
    constructor(args) {
        // mandatory args
        if (ud(args.frm)) {
            throw new Error('frm not found');
        } else {
            this.frm = args.frm;
        }
        if (ud(args.field)) {
            throw new Error('field not found');
        } else {
            this.field = args.field;
        }

        // optional args
        this.label = args.label || this.frm.fields_dict[this.field]._label;
        if (!ud(args.choiceFunc)) {
            this.choiceFunc = args.choiceFunc;
        }
        if (!ud(args.labelRe)) {
            this.labelRe = args.labelRe;
        }
        if (!ud(args.valueRe)) {
            this.valueRe = args.valueRe;
        }
        if (!ud(args.choice)) {
            this.choice = args.choice;
        }
        if (!ud(args.setUpChoice)) {
            this.setUpChoice = args.setUpChoice;
        } else {
            this.setUpChoice = true;
        }

        this.fieldType = this.frm.fields_dict[this.field].df.fieldtype;
        this.reqd = this.frm.fields_dict[this.field].df.reqd;
        this.hasValue = 0;

        // Add Input
        this.getInputHtml();
        this.insertInput();
        this.attatchInput();
        // Event Listener
        this.evtSelect();
        // Toggle has error
        this.toggleHasError();
        // Choice
        this.tryGetChoice();
        this.updateAweValue();
    }

    /**
     * @return {text} will use to insert input field
    */
    getInputHtml() {
        this.InputHtml = `
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
                            <input type="text" autocomplete="off"
                                class="input-with-feedback form-control" 
                                maxlength="140" placeholder="" data-fieldname="`
                                + 'search_' + this.field + `"
                                >
                        </div>
                    </div>
                </div>
            </div>
        </form>
        `;
        return this.InputHtml;
    }

    /** Insert custom input field after original link input field */
    insertInput() {
        this.oriField = $('[data-fieldname='+this.field+']');
        this.oriFieldPar = this.oriField.parent('form');
        $(this.InputHtml).insertBefore(this.oriFieldPar);
        this.jqField = $('[data-fieldname="search_'+this.field+'"]');
        this.cusField = this.jqField[0];
    }

    /** Attatch Awesomplete to custom input field */
    attatchInput() {
        this.aweField = new Awesomplete(this.cusField, {
            minChars: 1,
            maxItems: 100,
            list: this.choice || [],
            autoFirst: true,
        });
    }

    /** Change ori field when awesomlink change */
    evtSelect() {
        // Change value
        this.addEventLis(
            'awesomplete-selectcomplete',
            (e) => {
                let id = this.searchField(e.text.value);
                this.updateOriField(id);
            }
        );
        // Clear
        this.jqField.change((e) => {
            if (e.target.value === '') {
                this.updateOriField('');
            }
        });
        this.addEventLis(
            'awesomplete-select',
            (e) => {
                this.cusField.blur();
            }
        );
    }

    /** Try to get choice if error nothing return */
    async tryGetChoice() {
        if (ud(this.choice)) {
            let choiceInfo = await this.getChoiceInfo()
                .catch((e) => {
                    console.log(e);
                });
            if (this.setUpChoice === true) {
                if (!ud(choiceInfo)) {
                    this.choice = await getAweChoice(choiceInfo)
                        .catch((e) => {
                            console.log(e);
                        });
                    if (!ud(this.choice)) {
                        this.udChoice(this.choice);
                    }
                }
            }
        }
    }

    /** Set field value if frm is save */
    updateAweValue() {
        if (this.frm.doc.docstatus === 1) {
            console.log('this is update awe value');
            let fieldValue = this.frm.doc[this.field];
            let filters = {'name': fieldValue};
            this.choiceFunc(filters);
        }
    }

    /** Add event listener to custom input field 
     * @param {text} type - event type
     * @param {function} func - function ran when event is triggered
    */
    addEventLis(type, func) {
        this.cusField.addEventListener(
            type, func, false
        );
    }

    /** search id of values field in choice
     * @param {text} value 
     * - 'value' key from choice dict
     * @return {text} id
    */
    searchField(value) {
        let id;
        $.each(this.choice, (i, v) => {
            if (v.value===value) {
                id = v.id;
            }
        });
        return id;
    }

    /** update original field with id  
     * @param {text} id 
     * - id of DocType
    */
    updateOriField(id) {
        let e = new CustomEvent(
            'fieldUpdate',
            {detail:
                {
                    'id': id,
                    'frm': this.frm,
                    'choice': this.choice,
                },
            }
        );
        this.cusField.dispatchEvent(e);
        if (id) {
            this.id = id;
            this.frm.doc[this.field] = this.id;
            refresh_field(this.field);
            this.hasValue = 1;
            this.toggleHasError();
        } else {
            this.frm.doc[this.field] = '';
            refresh_field(this.field);
            this.hasValue = 0;
            this.toggleHasError();
        }
    }

    /** Autoselect value if there is only one choice */
    autoSel() {
        if (this.choice.length===1) {
            this.aweField.replace(this.choice[0]);
            this.updateOriField(this.choice[0].id);
        }
    }

    /** Update choice 
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
    udChoice(choice) {
        this.choice = choice;
        this.aweField._list = choice;
        this.autoSel();
    }

    /** Get doctype title_field
     * @param {text} doctype 
     * - name of doctype
     * @return {text} - return label
    */
    getLabel(doctype) {
        return new Promise((resolve, reject) => {
            frappe.call({
                method: 'custom_awesomelink.custom_awesomelink.' +
                'control.data.get_label',
                args: {
                    'doctype': doctype,
                },
                callback: function(r) {
                    if (r.message) {
                        resolve(r.message);
                    } else {
                        reject('Error: no label');
                    }
                },
                async: true,
            });
        });
    }

    /** Clear fields */
    clear() {
        this.cusField.value = '';
        this.updateOriField('');
    }

    /** Get choice information 
     * @return {dict}
    */
    async getChoiceInfo() {
        if (this.fieldType != 'Dynamic Link') {
            this.doctype = this.frm.fields_dict[this.field].df.options;
            if (ud(this.labelRe)) {
                this.labelRe = await this.getLabel(this.doctype);
            }
        }

        let choiceInfo = {};
        if (this.doctype) {
            choiceInfo.doctype = this.doctype;
        }
        if (this.label_re) {
            choiceInfo.label_re = this.labelRe;
        }
        if (this.value_re) {
            choiceInfo.value_re = this.valueRe;
        }
        if (this.filtered) {
            choiceInfo.filtered = this.filtered;
        }

        return new Promise((resolve, reject) => {
            if (this.doctype && this.labelRe) {
                resolve(choiceInfo);
            } else {
                reject('Error: no choice info');
            }
        });
    }

    /** Toggle has error class */
    toggleHasError() {
        if (this.reqd === 1) {
            this.jqField.addClass('bold');
            if (this.hasValue === 1) {
                this.jqField.parents('.frappe-control')
                    .removeClass('has-error');
            } else {
                this.jqField.parents('.frappe-control')
                    .addClass('has-error');
            }
        }
    }
}

/** Check if var is undeclared or undefined 
 * @param {any} v
 * @return {bool}
*/
function ud(v) {
    return typeof v === 'undefined';
}

/** Get awesomplete choice
 * @param {dict} args
 * @return {bool} false if not success
*/
function getAweChoice(args) {
    return new Promise((resolve, reject) => {
        frappe.call({
            method: 'custom_awesomelink.custom_awesomelink.' +
            'control.data.get_choice',
            args: args,
            callback: function(r) {
                if (r.message) {
                    resolve(r.message);
                } else {
                    reject('Error: could not get choice');
                }
            },
            async: true,
        });
    });
}