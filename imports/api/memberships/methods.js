import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Fraction } from 'fractional';

import { Log } from '/imports/utils/log.js';
import { checkExists, checkModifier, checkAddMemberPermissions } from '/imports/api/method-checks.js';
import { invite as inviteUserMethod } from '/imports/api/users/methods.js';
import { Parcels } from '/imports/api/parcels/parcels.js';
import { Memberships } from './memberships.js';

// We need a check of userEmail and userId matches.
// Easy solution is to not allow setting both fields in inserts and updates. Eg. userId will be the stronger.
// Alternatively we could throw an Error if they dont match.
function checkUserDataConsistency(membership) {
  if (membership.userId) {
    if (membership.userEmail) {
      Log.warning('Membership data contains both userId and userEmail', membership);
      delete membership.userEmail;
    }
  }
}

// Connecting the membership with a registered user (call if only email is provided and no user connected)
// from this point the user can change her email address, w/o breaking the association
export function connectUser(membershipId, userId) {
  const modifier = {
    $set: { userId },
    $unset: { userEmail: '' },      // !! break the email association - the userId is the new association
  };
  Memberships.update(membershipId, modifier);
}

// Sends out an invitation into the specific community to the provided email address
function inviteUser(membershipId, email) {
  const membership = Memberships.findOne(membershipId);
  Log.info(`Invitation sent to ${email}, to join community ${membership.community().name}`);
  // When user joins, with this email, she will automatically get connected to this membership
  inviteUserMethod.call({ email: membership.userEmail, communityId: membership.communityId });
  return;
}

// Sometimes only a email is given in the membership. In this case we can look if we have a registered user with such email,
// and then connect her to this membership. Or if not, we can send invitation to this email.
function connectUserIfPossible(membershipId) {
  const membership = Memberships.findOne(membershipId);
  const email = membership.userEmail;
  if (!membership.userId && email) {
    const user = Meteor.users.findOne({ 'emails.0.address': email });
    if (user && user.emails[0].verified) {  
      connectUser(membership._id, user._id);
    } else if (user && !user.emails[0].verified) {
      // if not verified, connection will happen when she verifies (thats the trigger)
      Log.info(`${email} not verified, but added to ${membership.community().name}`);
    } else {
      inviteUser(membership._id, email);
    }
  }
}

function checkSanityOfTotalShare(parcelId, totalShare) {
  if (totalShare.numerator > totalShare.denominator) {
    throw new Meteor.Error('err_sanityCheckFailed', 'Ownership share cannot exceed 1',
      `New total shares would become: ${totalShare}, for parcel ${parcelId}`);
  }
}

export const connectMe = new ValidatedMethod({
  name: 'memberships.connectMe',
  validate: null,

  run() {
    const email = Meteor.users.findOne(this.userId).emails[0].address;
    const userId = this.userId;
    Memberships.find({ userEmail: email }).forEach((membership) => {
      connectUser(membership._id, userId);
    });
  },
});

export const insertUnapproved = new ValidatedMethod({
  name: 'memberships.insert.unapproved',
  validate: Memberships.simpleSchema().validator({ clean: true }),

  run(doc) {
    // This can be done without any permission check. Because its unapproved.
    if (doc.role !== 'owner' || doc.approved !== false) {
      throw new Meteor.Error('err_permissionDenied', 'No permission to insert approved membership', `doc: ${doc}`);
    }
    return Memberships.insert(doc);
  },
});

export const insert = new ValidatedMethod({
  name: 'memberships.insert',
  validate: Memberships.simpleSchema().validator({ clean: true }),

  run(doc) {
    checkAddMemberPermissions(this.userId, doc.communityId, doc.role);
    if (doc.role === 'owner') {
      const total = Parcels.findOne({ _id: doc.parcelId }).ownedShare();
      const newTotal = total.add(doc.ownership.share);
      checkSanityOfTotalShare(doc.parcelId, newTotal);
    }
    checkUserDataConsistency(doc);
    const id = Memberships.insert(doc);
    connectUserIfPossible(id);
    return id;
  },
});

export const update = new ValidatedMethod({
  name: 'memberships.update',
  validate: new SimpleSchema({
    _id: { type: String, regEx: SimpleSchema.RegEx.Id },
    modifier: { type: Object, blackbox: true },
  }).validator(),

  run({ _id, modifier }) {
    const doc = checkExists(Memberships, _id);
    checkAddMemberPermissions(this.userId, doc.communityId, doc.role);
    checkModifier(doc, modifier, Memberships.modifiableFields.concat('approved'));
    const newrole = modifier.$set.role;
    if (newrole && newrole !== doc.role) {
      checkAddMemberPermissions(this.userId, doc.communityId, newrole);
    }
    if (doc.role === 'owner') {
      const total = Parcels.findOne({ _id: doc.parcelId }).ownedShare();
      const newTotal = total.subtract(doc.ownership.share).add(modifier.$set['ownership.share']);
      checkSanityOfTotalShare(doc.parcelId, newTotal);
    }
    checkUserDataConsistency(modifier.$set);
    Memberships.update({ _id }, modifier);
    connectUserIfPossible(_id);
  },
});

export const remove = new ValidatedMethod({
  name: 'memberships.remove',
  validate: new SimpleSchema({
    _id: { type: String, regEx: SimpleSchema.RegEx.Id },
  }).validator(),

  run({ _id }) {
    const doc = checkExists(Memberships, _id);
    checkAddMemberPermissions(this.userId, doc.communityId, doc.role);
    Memberships.remove(_id);
  },
});
