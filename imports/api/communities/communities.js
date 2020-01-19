import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Factory } from 'meteor/dburles:factory';
import faker from 'faker';
import { _ } from 'meteor/underscore';

import { debugAssert, releaseAssert } from '/imports/utils/assert.js';
import { comtype } from '/imports/comtypes/comtype.js';
import { autoformOptions, fileUpload } from '/imports/utils/autoform.js';
import { displayAddress } from '/imports/localization/localization.js';
import { availableLanguages } from '/imports/startup/both/language.js';
import { Timestamped } from '/imports/api/behaviours/timestamped.js';
import { Parcels } from '/imports/api/parcels/parcels.js';
import { Memberships } from '/imports/api/memberships/memberships.js';
import { MoneyAccounts } from '/imports/api/money-accounts/money-accounts.js';

export const Communities = new Mongo.Collection('communities');

const defaultAvatar = '/images/defaulthouse.jpg';
Communities.accountingMethods = ['cash', 'accrual'];

Communities.settingsSchema = new SimpleSchema({
  joinable: { type: Boolean, defaultValue: true },
  language: { type: String, allowedValues: availableLanguages, autoform: { firstOption: false } },
  topicAgeDays: { type: Number, decimal: true, defaultValue: 90 },
  currency: { type: String, max: 3, defaultValue: 'Ft' },
  accountingMethod: { type: String, allowedValues: Communities.accountingMethods, autoform: autoformOptions(Communities.accountingMethods, 'schemaCommunities.settings.accountingMethod.'), defaultValue: 'accrual' },
});

Communities.schema = new SimpleSchema([{
  name: { type: String, max: 100 },
  description: { type: String, max: 1200, optional: true },
  avatar: { type: String, defaultValue: defaultAvatar, optional: true, autoform: fileUpload },
}, comtype.profileSchema, {
  management: { type: String, optional: true, autoform: { type: 'textarea' } },
  taxNumber: { type: String, max: 50, optional: true },
  totalunits: { type: Number },
  settings: { type: Communities.settingsSchema },
  // redundant fields:
  parcels: { type: Object, blackbox: true, defaultValue: {}, autoform: { omit: true } },
}]);

Meteor.startup(function indexCommunities() {
  if (Meteor.isServer) {
    Communities._ensureIndex({ name: 1 });
    Communities._ensureIndex({ lot: 1 });
  }
});

Communities.publicFields = {
  totalunits: 0,
};

Communities.helpers({
  registeredUnits() {
    let total = 0;
    Parcels.find({ communityId: this._id }).forEach(p => total += p.units);
    return total;
  },
  displayAddress() {
    return displayAddress(this);
  },
  asPartner() {
    const partner = _.clone(this);
    partner.contact = { address: this.displayAddress() };
    partner.bankAccountNumber = this.primaryBankAccount().number; 
    return partner;
  },
  moneyAccounts() {
    return MoneyAccounts.find({ communityId: this._id });
  },
  primaryBankAccount() {
    const bankAccount = MoneyAccounts.findOne({ communityId: this._id, category: 'bank', primary: true });
    if (!bankAccount) throw new Meteor.Error('err_notExixts', 'no primary bankaccount configured');
    return bankAccount;
  },
  primaryCashAccount() {
    const cashAccount = MoneyAccounts.findOne({ communityId: this._id, category: 'cash', primary: true });
    if (!cashAccount) throw new Meteor.Error('err_notExixts', 'no primary cash account configured');
    return cashAccount;
  },
  userWithRole(role) {
    const membershipWithRole = Memberships.findOneActive({ communityId: this._id, role });
    if (!membershipWithRole) return undefined;
    return membershipWithRole.user();
  },
  admin() {
    return this.userWithRole('admin');
  },
  treasurer() {
    return this.userWithRole('treasurer') || this.userWithRole('manager') || this.userWithRole('admin');
  },
  techsupport() {
    return this.admin(); // TODO: should be the person with do.techsupport permission
  },
  users() {
    const users = Memberships.findActive({ communityId: this._id, userId: { $exists: true } }).map(m => m.user());
    return _.uniq(users, false, u => u._id);
  },
  voterships() {
    const voterships = Memberships.findActive({ communityId: this._id, approved: true, role: 'owner', userId: { $exists: true } })
      .fetch().filter(ownership => !ownership.isRepresentedBySomeoneElse());
    return voterships;
  },
  voters() {
    const voters = this.voterships().map(v => v.person());
    return _.uniq(voters, false, u => u._id);
  },
  toString() {
    return this.name;
  },
});

Communities.attachSchema(Communities.schema);
Communities.attachBehaviour(Timestamped);

Meteor.startup(function attach() {
  Communities.simpleSchema().i18n('schemaCommunities');
});

if (Meteor.isServer) {
  Communities.after.remove(function (userId, doc) {
    // cascading clean was moved to the method
  });
}

Factory.define('community', Communities, {
  name: () => faker.random.word() + 'house',
  description: () => faker.lorem.sentence(),
  zip: () => faker.random.number({ min: 1000, max: 2000 }).toString(),
  city: () => faker.address.city(),
  street: () => faker.address.streetName(),
  number: () => faker.random.number().toString(),
  lot: () => faker.finance.account(6) + '/' + faker.finance.account(4),
  avatar: 'http://4narchitects.hu/wp-content/uploads/2016/07/LEPKE-1000x480.jpg',
  taxNumber: () => faker.finance.account(6) + '-2-42',
  totalunits: 1000,
  settings: {
    joinable: true,
    language: 'en',
    currency: '$',
    accountingMethod: 'cash',
  },
});
