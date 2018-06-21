import { Meteor } from 'meteor/meteor';
import { _ } from 'meteor/underscore';

import { Permissions } from '/imports/api/permissions/permissions.js';
import '/imports/api/users/users.js';

export function checkLoggedIn(userId) {
  if (!userId) {
    throw new Meteor.Error('err_notLoggedIn',
      'Only logged in users can perform this activity.');
  }
}

export function checkExists(collection, predicate) {
  // Checks that a *collection* already contains a doc with given *objectId*
  const object = collection.findOne(predicate);
  if (!object) {
    throw new Meteor.Error('err_invalidId', 'No such object',
      `Collection: ${collection._name}, id: ${predicate}`
    );
  }
  return object;
}

export function checkNotExists(collection, predicate) {
  // Checks that a *collection* does not yet contain a doc with given *objectId*
  const object = collection.findOne(predicate);
  if (object) {
    throw new Meteor.Error('err_duplicateId', 'This id is already used',
      `Collection: ${collection._name}, predicate: ${JSON.stringify(predicate)}` 
    );
  }
}

export function checkPermissions(userId, permissionName, communityId, object) {
  // Checks that *user* has *permission* in given *community* to perform things on given *object*
  const user = Meteor.users.findOne(userId);
  if (!user.hasPermission(permissionName, communityId, object)) {
    throw new Meteor.Error('err_permissionDenied', 'No permission to perform this activity',
      `Permission: ${permissionName}, userId: ${userId}, communityId: ${communityId}, objectId: ${object ? object._id : '-'}`);
  }
}

export function checkTopicPermissions(userId, permissionName, topic) {
  // Checks that *user* has *permission* to perform things on given *topic*
  if ((topic.category === 'vote') && (topic.vote.effect === 'poll')) return;    // no permission needed for poll vote
  const categoryPermissionName = `${topic.category}.${permissionName}`;
  const genericPermissionName = `topics.${permissionName}`;
  const categoryPermission = Permissions.find(perm => perm.name === categoryPermissionName);
  if (categoryPermission) {
    checkPermissions(userId, categoryPermission.name, topic.communityId, topic);
  } else {
    checkPermissions(userId, genericPermissionName, topic.communityId, topic);
  }
}

export function checkAddMemberPermissions(userId, communityId, roleOfNewMember) {
  // Checks that *user* has permission to add new member in given *community*  
  const user = Meteor.users.findOne(userId);
  let permName;
  switch (roleOfNewMember) {
    case ('guest'): return;  // TODO: who can join as guest? or only in Demo house?)
    case ('owner'): permName = 'ownerships.update'; break;
    case ('benefactor'): permName = 'benefactorships.update'; break;
    default: permName = 'roleships.update';
  }
  if (!user.hasPermission(permName, communityId)) {
    throw new Meteor.Error('err_permissionDenied', 'No permission to perform this activity',
      `roleOfNewMember: ${roleOfNewMember}, userId: ${userId}, communityId: ${communityId}`);
  }
}

export function checkModifier(object, modifier, modifiableFields, exclude = false) {
  // Checks that the *modifier* only tries to modify the *modifiableFields* on the given *object*
  // if exclude === true, then the fields given, are the ones that should NOT be modified, and all other fields can be modified
  let modifiedFields = Object.keys(modifier.$set);
  modifiedFields = _.without(modifiedFields, 'updatedAt');
  modifiedFields.forEach((mf) => {
    if ((exclude && _.contains(modifiableFields, mf) && !_.isEqual(Object.byString(object, mf), modifier.$set[mf]))
      || (!exclude && !_.contains(modifiableFields, mf) && !_.isEqual(Object.byString(object, mf), modifier.$set[mf]))) {
      throw new Meteor.Error('err_permissionDenied', 'No permission to perform this activity',
        `Field: ${mf}\n Modifier: ${JSON.stringify(modifier)}\n Object: ${JSON.stringify(object)}`);
    }
  });
}
