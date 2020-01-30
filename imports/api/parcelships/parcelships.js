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

const chooseParcel = {
  options() {
    const communityId = Session.get('activeCommunityId');
    const options = Parcels.find({ communityId }).map(function option(p) {
      return { label: p.ref, value: p._id };
    });
    return options;
  },
  firstOption: () => __('(Select one)'),
};

Parcelships.schema = new SimpleSchema({
  communityId: { type: String, regEx: SimpleSchema.RegEx.Id, autoform: { omit: true } },
  parcelId: { type: String, regEx: SimpleSchema.RegEx.Id, optional: false },
  leadParcelId: { type: String, regEx: SimpleSchema.RegEx.Id, autoform: chooseParcel },
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
  leadParcel() {
    return Parcels.findOne(this.leadParcelId);
  },
  followerParcel() {
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
