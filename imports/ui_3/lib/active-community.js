import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { Settings } from '/imports/api/settings/settings.js';
import { ModalStack } from '/imports/ui_3/lib/modal-stack.js';
import { Communities } from '/imports/api/communities/communities.js';

export function autosetActiveCommunity() {
  const activeCommunityId = ModalStack.getVar('communityId');
  const user = Meteor.user();
  if (user && (!activeCommunityId || !user.isInCommunity(activeCommunityId))) {
    const communities = user.communities();
    if (communities.count() > 0) {
      const activeCommunity = communities.fetch()[0];
      ModalStack.setVar('communityId', activeCommunity._id, true);
    }
  }
}

export function getActiveCommunityId() {
  return ModalStack.getVar('communityId');
}

export function getActiveCommunity() {
  const id = getActiveCommunityId();
  return Communities.findOne(id);
}

export function defaultNewDoc() {
  return { communityId: FlowRouter.getParam('_cid') || getActiveCommunityId() };
}

// This cannot be in settings.js becuase then circular dependency: settings > activeCommunity > modalstack > settings
Settings.getForCommunity = function getForCommunity(name) {
  const selector = { userId: Meteor.userId(), communityId: getActiveCommunityId() };
  return Settings.get(name, selector);
};

Settings.setForCommunity = function setForCommunity(name, value) {
  const selector = { userId: Meteor.userId(), communityId: getActiveCommunityId() };
  return Settings.set(name, value, selector);
};
