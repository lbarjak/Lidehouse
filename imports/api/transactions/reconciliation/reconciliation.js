import { Meteor } from 'meteor/meteor';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { AutoForm } from 'meteor/aldeed:autoform';

import { ModalStack } from '/imports/ui_3/lib/modal-stack.js';
import { __ } from '/imports/localization/i18n.js';
import { Transactions } from '/imports/api/transactions/transactions.js';
import { Txdefs } from '/imports/api/transactions/txdefs/txdefs.js';
import { StatementEntries } from '/imports/api/transactions/statement-entries/statement-entries.js';

export const chooseTxdef = {
  options() {
    const communityId = ModalStack.getVar('communityId');
    const txdefs = Txdefs.find({ communityId }).fetch().filter(td => td.isReconciledTx());
    const options = txdefs.map(txdef => ({ label: __(txdef.name), value: txdef._id }));
    return options;
  },
  firstOption: () => __('(Select one)'),
//    return false;
//    const txdef = ModalStack.getVar('txdef');
//    return txdef._id;
//  },
};

export const chooseTransaction = {
  relation: 'transaction',
  value() {
    const selfId = AutoForm.getFormId();
    const defId = AutoForm.getFieldValue('defId');
    if (!defId) return undefined;
    const txdef = Txdefs.findOne(defId);
    return ModalStack.readResult(selfId, `af.${txdef.category}.create`);
  },
  options() {
    const communityId = ModalStack.getVar('communityId');
    const defId = AutoForm.getFieldValue('defId');
    if (!defId) return [];
    const txdef = Txdefs.findOne(defId);
    const selector = { communityId, defId, status: { $ne: 'void' } };
    if (txdef.category !== 'transfer') selector.seId = { $exists: false };
    let txs = Transactions.find(selector);
    if (txdef.category === 'transfer') txs = txs.fetch().filter(tx => !tx.isReconciled());
    const options = txs.map(tx => ({ label: tx.displayInSelect(), value: tx._id }));
    return options;
  },
  firstOption: () => __('(Select one)'),
};

export const reconciliationSchema = new SimpleSchema({
  _id: { type: String, regEx: SimpleSchema.RegEx.Id, autoform: { omit: true } },
  txId: { type: String, regEx: SimpleSchema.RegEx.Id, autoform: { ...chooseTransaction } },
// on the form only:
  defId: { type: String, regEx: SimpleSchema.RegEx.Id, optional: true, autoform: { ...chooseTxdef } },
});

reconciliationSchema.i18n('schemaStatementEntries');
reconciliationSchema.i18n('schemaTransactions');
