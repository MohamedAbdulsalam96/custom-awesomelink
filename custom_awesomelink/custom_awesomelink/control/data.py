# -*- coding: utf-8 -*-
# Copyright (c) 2018, SpaceCode Co., Ltd. and contributors
# For license information, please see license.txt

import frappe
import re


@frappe.whitelist()
def get_choice(doctype, label_re, value_re='', filters={}):
    """Get Awesomplete choice.

    Args:
        doctype: doctype name
        label_re: label format with wanted fields
        value_re: value format with wanted fields

    Example Usage:
        get_choice(
            doctype='withholdee',
            label_re='{tax_id} - {org_type}{org_name}',
            value_re='{org_type}{org_name}'
            )

    Example Return:
        choice=[
            {
                'lable': '0226672009956 - บจก.ฐาปนา16',
                'value': 'บจก.ฐาปนา16',
                'id': '13c5b2163f',
            },
            {
                'lable': '0115561008845 - บจก.สเปซโค้ด',
                'value': 'บจก.สเปซโค้ด',
                'id': 'f4c9899dfa',
            },
        ],
    """
    doctype = str(doctype)
    label_re = str(label_re)

    if not value_re:
        value_re = label_re
    else:
        value_re = str(value_re)

    fields = re.findall(r'\{(.+?)\}', label_re + value_re)
    fields.append('name')
    fields = list(set(fields))
    var_list = frappe.get_list(
        doctype=doctype,
        fields=fields,
        filters=filters
    )

    new_list = []
    for i in var_list:
        i = utf8dict(i)
        dict = {
            'label': label_re.format(**i),
            'value': value_re.format(**i),
            'id': i['name'],
            }
        new_list.append(dict)

    return new_list


def utf8dict(dict):
    """UTF-8 dict hack.

    Workaround for > UnicodeEncodeError: 'ascii' codec
    can't encode characters in position 0-2: ordinal not in range(128)
    """
    dict = {k: v.encode('utf-8') for k, v in dict.iteritems()}
    return dict


@frappe.whitelist()
def get_label(doctype):
    """Get title field from doctype name.

    Args:
        doctype: doctype name

    Example Usage:
        get_title(doctype='withholdee')
    """
    doctype = str(doctype)

    if not frappe.db.exists('DocType', doctype):
        raise ValueError('{} is not a valid Doctype name'.format(doctype))

    meta = frappe.get_meta(doctype)

    if meta.title_field:
        label = '{' + meta.title_field + '}'
    else:
        if meta.description:
            label = meta.description
        else:
            return ''

    return label
