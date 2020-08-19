import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { _ } from 'meteor/underscore';
import { debugAssert } from '/imports/utils/assert.js';
import { Log } from '/imports/utils/log.js';
import { MinimongoIndexing } from '/imports/startup/both/collection-patches.js';
import { Transactions } from '../transactions.js';
import { AccountSpecification } from '../account-specification.js';

export const JournalEntries = new Mongo.Collection(null);

Meteor.startup(function indexJournalEntries() {
  if (MinimongoIndexing) {
//      JournalEntries._collection._ensureIndex('account');
    // JournalEntries._collection._ensureIndex(['account', 'localizer']);
    JournalEntries._collection._ensureIndex('txId');
  }
});

JournalEntries.helpers({
  debitAmount() {
    return (this.side === 'debit') ? this.amount : 0;
  },
  creditAmount() {
    return (this.side === 'credit') ? this.amount : 0;
  },
  effectiveAmount(extraSign = +1) {
    let dcSign = 0;
    if (this.side === 'debit') dcSign = +1;
    else if (this.side === 'credit') dcSign = -1;
    else debugAssert(false, `Unrecognized side: ${this.side}`);
    return this.amount * dcSign * extraSign;
  },
  transaction() {
    const tx = Transactions.findOne(this.txId);
    if (!tx) Log.warning(`Tx with id ${this.txId} NOT found`);
    return tx;
  },
  contra() {
    function otherSide(side) {
      if (side === 'credit') return 'debit';
      if (side === 'debit') return 'credit';
      debugAssert(false); return undefined;
    }
    const tx = this.transaction();
    if (!tx) return {};
    const contraEntries = tx[otherSide(this.side)];
    if (!contraEntries) return {};
    const contraAccount = AccountSpecification.fromDoc(contraEntries[0]);
    return contraAccount;
  },
});

if (Meteor.isClient) {
  Meteor.startup(function syncEntriesWithTransactions() {
    const callbacks = {
      added(doc) {
        doc.journalEntries().forEach(e => JournalEntries.insert(e));
      },
      changed(newDoc, oldDoc) {
        // TODO no need to do it, when only the updatedAt field changes
        JournalEntries.remove({ txId: oldDoc._id });
        newDoc.journalEntries().forEach(e => JournalEntries.insert(e));
      },
      removed(doc) {
        JournalEntries.remove({ txId: doc._id });
      },
    };
    Transactions.find().observe(callbacks);
  });
}
