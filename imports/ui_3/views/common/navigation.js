import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import MetisMenu from 'metismenujs';

import { Parcels } from '/imports/api/parcels/parcels.js';
import { Memberships } from '/imports/api/memberships/memberships.js';
import { Topics } from '/imports/api/topics/topics.js';
import '/imports/api/users/users.js';

import './navigation.html';

Template.Navigation.onRendered(function() {
  // Initialize metisMenu
  new MetisMenu('#side-menu', {
    toggle: true,
    activeClass: 'active',
    collapseClass: 'collapse',
    collapseInClass: 'in',
    collapsingClass: 'collapsing',
    preventDefault: true,
  });
});

Template.Navigation.helpers({
  countNotifications(category) {
    const communityId = Session.get('activeCommunityId');
    let count = 0;
    const topics = Topics.find({ communityId, category });
    topics.map(t => {
      const userId = Meteor.userId();
      count += t.needsAttention(userId);
    });
    return count;
  },
  countUnapprovedEntities() {
    const communityId = Session.get('activeCommunityId');
    const unapprovedParcelCount = Parcels.find({ communityId, approved: false }).count();
    const unapprovedMembershipCount = Memberships.find({ communityId, approved: false }).count();
    return unapprovedParcelCount + unapprovedMembershipCount;
  },
  developerMode() {
    return false;     // set this true to access developer features
  },
});
