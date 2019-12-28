/* eslint no-param-reassign: "off" */
/* eslint func-names: ["error", "as-needed"] */
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Factory } from 'meteor/dburles:factory';

import { __ } from '/imports/localization/i18n.js';
import { Timestamped } from '/imports/api/behaviours/timestamped.js';
import { ActivePeriod } from '/imports/api/behaviours/active-period.js';
import { Parcels } from '/imports/api/parcels/parcels.js';

const Session = (Meteor.isClient) ? require('meteor/session').Session : { get: () => undefined };

export const Parcelships = new Mongo.Collection('parcelships');

const chooseLeadRef = {
  options() {
    const communityId = Session.get('activeCommunityId');
    const options = Parcels.find({ communityId }).fetch().map(function option(p) {
      return { label: p.ref, value: p.ref };
    });
    return options;
  },
  firstOption: () => __('(Select one)'),
};

Parcelships.schema = new SimpleSchema({
  communityId: { type: String, regEx: SimpleSchema.RegEx.Id, autoform: { omit: true } },
  parcelId: { type: String, regEx: SimpleSchema.RegEx.Id, optional: false },
  leadRef: { type: String, optional: false, autoform: chooseLeadRef },
  leadParcelId: { type: String, regEx: SimpleSchema.RegEx.Id,
    autoValue() {
      const leadRef = this.field('leadRef').value;
      if (!leadRef) return undefined;
      const communityId = this.field('communityId').value;
      return Parcels.findOne({ communityId, ref: leadRef })._id;
    },
  },
  approved: { type: Boolean, defaultValue: true, autoform: { omit: true } },
});

Meteor.startup(function indexParcelships() {
  Parcelships.ensureIndex({ parcelId: 1 });
  Parcelships.ensureIndex({ leadParcelId: 1 });
  if (Meteor.isServer) {
    Parcelships._ensureIndex({ communityId: 1 });
  }
});

Parcelships.helpers({
  ledParcel() {
    return Parcels.findOne(this.parcelId);
  },
  entityName() {
    return 'parcelships';
  },
});

Parcelships.attachSchema(Parcelships.schema);
Parcelships.attachBehaviour(ActivePeriod);
Parcelships.attachBehaviour(Timestamped);

Meteor.startup(function attach() {
  Parcelships.simpleSchema().i18n('schemaParcelships');
  Parcelships.simpleSchema().i18n('schemaActivePeriod');
});

Factory.define('parcelship', Parcelships, {
});