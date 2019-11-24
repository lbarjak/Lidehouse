import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { AutoForm } from 'meteor/aldeed:autoform';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Fraction } from 'fractional';
import { AccountsTemplates } from 'meteor/useraccounts:core';

import { __ } from '/imports/localization/i18n.js';
import { Modal } from 'meteor/peppelg:bootstrap-3-modal';
import '/imports/ui_3/views/modals/autoform-edit.js';
import { currentUserHasPermission } from '/imports/ui_3/helpers/permissions.js';
import { handleError, onSuccess, displayError, displayMessage } from '/imports/ui_3/lib/errors.js';
import { Parcels } from '/imports/api/parcels/parcels.js';
import { Memberships } from '/imports/api/memberships/memberships.js';
import { Communities } from './communities.js';
import './methods.js';

Communities.actions = {
  new: {
    name: 'new',
    icon: () => 'fa fa-plus',
    visible: () => currentUserHasPermission('communities.insert'),
    run() {
      Modal.show('Autoform_edit', {
        id: 'af.community.insert',
        collection: Communities,
        type: 'method',
        meteormethod: 'communities.create',
      });
    },
  },
  view: {
    name: 'view',
    icon: () => 'fa fa-eye',
    visible: () => currentUserHasPermission('communities.inCommunity'),
    run(id) {
      Modal.show('Autoform_edit', {
        id: 'af.community.view',
        collection: Communities,
        doc: Communities.findOne(id),
        type: 'readonly',
      });
    },
  },
  edit: {
    name: 'edit',
    icon: () => 'fa fa-pencil',
    visible: () => currentUserHasPermission('communities.update'),
    run(id) {
      Modal.show('Autoform_edit', {
        id: 'af.community.update',
        collection: Communities,
        doc: Communities.findOne(id),
        type: 'method-update',
        meteormethod: 'communities.update',
        singleMethodArgument: true,
      });
    },
  },
  period: {
    name: 'period',
    icon: () => 'fa fa-history',
    visible: () => currentUserHasPermission('communities.update'),
    run(id) {
      Modal.show('Autoform_edit', {
        id: 'af.community.update',
        collection: Communities,
        fields: ['activeTime'],
        doc: Communities.findOne(id),
        type: 'method-update',
        meteormethod: 'communities.updateActivePeriod',
        singleMethodArgument: true,
      });
    },
  },
  join: {
    name: 'join',
    icon: () => 'fa fa-suitcase',
    visible: (id) => Communities.findOne(id).settings.joinable,
    run(id) {
      AccountsTemplates.forceLogin(() => {
        Modal.show('Autoform_edit', {
          title: 'pleaseSupplyParcelData',
          id: 'af.parcel.insert.unapproved',
          collection: Parcels,
          //        omitFields: ['serial'],
          type: 'method',
          meteormethod: 'parcels.insert',
        });

        /*    This can be used for immediate (no questions asked) joining - with a fixed ownership share
              const communityId = FlowRouter.current().params._cid;
              const maxSerial = Math.max.apply(Math, _.pluck(Parcels.find().fetch(), 'serial')) || 0;
              Meteor.call('parcels.insert',
                { communityId, approved: false, serial: maxSerial + 1, units: 300, type: 'flat' },
                (error, result) => { onJoinParcelInsertSuccess(result); },
              );
        */
      });
    },
  },
  delete: {
    name: 'delete',
    icon: () => 'fa fa-trash',
    visible: () => currentUserHasPermission('communities.remove'),
    run(id) {
      Modal.confirmAndCall(Communities.methods.remove, { _id: id }, {
        action: 'delete community',
        message: 'You should rather archive it',
      });
    },
  },
};

//-----------------------------------------------

export function onJoinParcelInsertSuccess() {
  const communityId = FlowRouter.current().params._cid;
  const communityName = Communities.findOne(communityId).name;
  Memberships.methods.insert.call({
    person: { userId: Meteor.userId() },
    communityId,
    approved: false,  // any user can submit not-yet-approved memberships
    role: 'owner',
    ownership: {
      share: new Fraction(1),
    },
  }, (err, res) => {
    if (err) displayError(err);
    else displayMessage('success', 'Join request submitted', communityName);
    Meteor.setTimeout(() => Modal.show('Modal', {
      title: __('Join request submitted', communityName),
      text: __('Join request notification'),
      btnOK: 'ok',
      //      btnClose: 'cancel',
      onOK() { FlowRouter.go('App home'); },
      //      onClose() { removeMembership.call({ _id: res }); }, -- has no permission to do it, right now
    }), 3000);
  });
}

AutoForm.addModalHooks('af.community.insert');
AutoForm.addModalHooks('af.community.update');