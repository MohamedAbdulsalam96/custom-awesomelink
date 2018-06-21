'use strict';

/** Custom input field for Frappe Framework using Awesomplete. */
class AwesomeLink {
    /** Constructor!!!. 
     * @param {object} args 
     * - frm {object}: frm object from Frappe Framework
     * - field {text}: field name in doctype
     *  field='withholdee',
     * - label {text}: label name for new field
     *  label='ผู้ถูกหักภาษี',
     * - choice {dict}: dictionary of choice 'lable' and 'value'
     *  choice=[
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
    constructor(args) {
        if (args.frm) {
            this.frm = args.frm;
        }
        if (args.field) {
            this.field = args.field;
        }
        this.label = args.label || this.frm.fields_dict[this.field]._label;
        this.labelRe = args.labelRe || '';
        this.valueRe = args.valueRe || '';
        this.choice = args.choice || [];

        this.getInputHtml();
        this.insertInput();
        this.attatchInput();
        this.evtOriSel();
        this.autoSel();
        this.tryGetChoice();
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
        this.cusField = $('[data-fieldname="search_'+this.field+'"]')[0];
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
            type, func.bind(this)
        );
    }

    /** update original field with id  
     * @param {text} id 
     * - name of DocType
     * - label='13c5b2163f',
    */
   evtOriSel() {
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
        if (id) {
            this.id = id;
            this.frm.doc[this.field] = this.id;
            refresh_field(this.field);
        } else {
            this.frm.doc[this.field] = '';
            refresh_field(this.field);
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
                        reject('labelNotFound');
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

    /** Get awesomplete choice
     * @param {text} doctype - name of doctype
     * @param {text} labelRe
     * - labelRe = '{tax_id}-{org_type}{org_name}'
     * @param {text} valueRe
     * - valueRe = '{tax_id}-{org_type}{org_name}'
     * @param {dict} filters
     * @return {bool} false if not success
    */
    async getChoice(doctype, labelRe, valueRe, filters) {
        let getLabel;
        this.filters = filters;
        if (labelRe) {
            this.labelRe = labelRe;
        } else {
            getLabel = await this.getLabel(doctype);
        }
        if (valueRe) {
            this.valueRe = valueRe;
        }
        return new Promise((resolve, reject) => {
            if (!labelRe) {
                this.labelRe = getLabel;
                if (!this.labelRe) {
                    reject('label not found');
                }
                if (!valueRe) {
                    this.valueRe = this.labelRe;
                }
            }

            if (this.labelRe != 'none') {
                frappe.call({
                    method: 'custom_awesomelink.custom_awesomelink.' +
                    'control.data.get_choice',
                    args: {
                        'doctype': doctype,
                        'label_re': this.labelRe,
                        'value_re': this.valueRe,
                        'filters': this.filters,
                    },
                    callback: function(r) {
                        if (r.message) {
                            resolve(r.message);
                        } else {
                            reject('could not get choice');
                        }
                    },
                    async: true,
                });
            }
        });
    }

    /** Try to get choice if error nothing return */
    async tryGetChoice() {
        this.FieldType = this.frm.fields_dict[this.field].df.fieldtype;
        if (this.FieldType != 'Dynamic Link') {
            this.doctype = this.frm.fields_dict[this.field].df.options;
            if (!this.choice.length) {
                if (!this.labelRe) {
                    this.labelRe = await this.getLabel(this.doctype);
                }
                if (this.labelRe != 'none') {
                    this.choice = await this.getChoice(
                        this.doctype,
                        this.labelRe,
                        this.valueRe
                    );
                    this.udChoice(this.choice);
                }
            };
        }
    }
}
