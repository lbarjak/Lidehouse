import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Modal } from 'meteor/peppelg:bootstrap-3-modal';
import { AutoForm } from 'meteor/aldeed:autoform';
import { _ } from 'meteor/underscore';

import { ModalStack } from '/imports/ui_3/lib/modal-stack.js';
import { Transactions } from '/imports/api/transactions/transactions.js';
import { Txdefs } from '/imports/api/transactions/txdefs/txdefs.js';
import { StatementEntries } from '/imports/api/transactions/statement-entries/statement-entries.js';
import '/imports/api/transactions/actions.js';
import '/imports/ui_3/views/components/doc-view.js';
import './reconciliation.html';

Template.Reconciliation.viewmodel({
  originalStatementEntry() {
    return ModalStack.getVar('statementEntry')?.original;
  },
});

Template.Reconciliation.onRendered(function () {
  const instance = this;
//  const tx = this.data.doc;
//  const options = this.data.options;
  const se = ModalStack.getVar('statementEntry');
  instance.data.newTransactionLaunched = false;
  instance.autorun((computation) => {
    const defId = AutoForm.getFieldValue('defId');
    if (!defId) return;
    const txdef = Txdefs.findOne(defId);
    const result = ModalStack.readResult('af.statementEntry.reconcile', `af.${txdef.category}.create`);
    if (result) {
      Meteor.setTimeout(() => {
        computation.stop();
        StatementEntries.methods.reconcile.call({ _id: se._id, txId: result });
        Modal.hide(instance.parent(3));
      }, 1000);
    }
    const communityId = txdef.communityId;
    let hasChoosableTx;
    if (txdef.category === 'transfer') {
      hasChoosableTx = Transactions.find({ communityId, defId, status: { $ne: 'void' } }).fetch().filter(tx => !tx.seId || tx.seId.length < 2).length;
    } else hasChoosableTx = Transactions.findOne({ communityId, defId, status: { $ne: 'void' }, seId: { $exists: false } });
    if (!hasChoosableTx) {
      if (!instance.data.newTransactionLaunched) {
        instance.data.newTransactionLaunched = true;
        const newTx = {}; Transactions.setTxdef(newTx, txdef);
        Transactions.actions.create({}, newTx).run();
      }
    }
  });
});
