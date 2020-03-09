/* globals document */
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Session } from 'meteor/session';
import { TAPi18n } from 'meteor/tap:i18n';
import { AutoForm } from 'meteor/aldeed:autoform';
import { Modal } from 'meteor/peppelg:bootstrap-3-modal';
import { datatables_i18n } from 'meteor/ephemer:reactive-datatables';
import { __ } from '/imports/localization/i18n.js';

import { onSuccess, handleError, displayMessage, displayError } from '/imports/ui_3/lib/errors.js';
import { Transactions } from '/imports/api/transactions/transactions.js';
import '/imports/api/transactions/actions.js';
import { Txdefs } from '/imports/api/transactions/txdefs/txdefs.js';
import '/imports/api/transactions/txdefs/actions.js';
import { Accounts } from '/imports/api/transactions/accounts/accounts.js';
import { Parcels } from '/imports/api/parcels/parcels.js';
import { accountColumns } from '/imports/api/transactions/accounts/tables.js';
import { localizerColumns } from '/imports/api/parcels/tables.js';
import '/imports/api/transactions/accounts/actions.js';
import { actionHandlers } from '/imports/ui_3/views/blocks/action-buttons.js';
import '/imports/api/transactions/txdefs/methods.js';
import '/imports/ui_3/views/modals/confirmation.js';
import '/imports/ui_3/views/modals/autoform-modal.js';
import './accounting-setup.html';

Template.Accounting_setup.viewmodel({
  onCreated(instance) {
    instance.autorun(() => {
      const communityId = this.communityId();
      instance.subscribe('accounts.inCommunity', { communityId });
      instance.subscribe('txdefs.inCommunity', { communityId });
      instance.subscribe('parcels.inCommunity', { communityId });
    });
  },
  communityId() {
    return Session.get('activeCommunityId');
  },
  noAccountsDefined() {
    return !Accounts.findOne({ communityId: this.communityId() });
  },
  txdefs() {
    const txdefs = Txdefs.find({ communityId: this.communityId() });
    return txdefs;
  },
  accounts() {
    const accounts = Accounts.find({ communityId: this.communityId() }, { sort: { code: 1 } });
    return accounts;
  },
  moneyAccounts() {
//    const accounts = Accounts.findOne({ communityId: this.communityId(), name: 'Money accounts' });
//    return accounts && accounts.nodes(true);
    const accounts = Accounts.find({ communityId: this.communityId(), category: { $in: ['bank', 'cash'] } }, { sort: { code: 1 } });
    return accounts.fetch();
  },
  accountsTableDataFn(tab) {
    const templateInstance = Template.instance();
    const communityId = this.communityId();
    function getTableData() {
      if (!templateInstance.subscriptionsReady()) return [];
      return Accounts.find({ communityId }, { sort: { code: 1 } }).fetch();
    }
    return getTableData;
  },
  accountsOptionsFn() {
    return () => Object.create({
      id: 'accounts',
      columns: accountColumns(),
      tableClasses: 'display',
      language: datatables_i18n[TAPi18n.getLanguage()],
      paging: false,
      info: false,
    });
  },
  localizersTableDataFn(tab) {
    const templateInstance = Template.instance();
    const communityId = this.communityId();
    function getTableData() {
      if (!templateInstance.subscriptionsReady()) return [];
      return Parcels.find({ communityId }).fetch();
    }
    return getTableData;
  },
  localizersOptionsFn() {
    return () => Object.create({
      id: 'localizers',
      columns: localizerColumns(),
      tableClasses: 'display',
      language: datatables_i18n[TAPi18n.getLanguage()],
      paging: false,
      info: false,
    });
  },
  optionsOf(accountCode) {
    return Accounts.nodeOptionsOf(this.communityId(), accountCode, true);
  },
});

Template.Accounting_setup.events({
  'click #coa .js-clone'(event, instance) {
    const communityId = Session.get('activeCommunityId');
    Transactions.methods.cloneAccountingTemplates.call({ communityId }, handleError);
  },
});
