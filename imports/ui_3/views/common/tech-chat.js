import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';
import { handleError, onSuccess } from '/imports/ui_3/lib/errors.js';
import { Topics } from '/imports/api/topics/topics.js';
import { Rooms } from '/imports/api/topics/rooms/rooms.js';
import { Comments } from '/imports/api/comments/comments.js';
import { Communities } from '/imports/api/communities/communities.js';

import './tech-chat.html';

function getMyTechSupportRoom() {
  const myUserId = Meteor.userId();
  const communityId = Session.get('activeCommunityId');
  return Topics.findOne({ communityId, category: 'room', title: 'tech support', participantIds: myUserId });
}

Template.Tech_chat.onCreated(function tehcChatOnCreated() {
  this.autorun(() => {
    const room = getMyTechSupportRoom();
    if (room) {
      this.subscribe('comments.onTopic', { topicId: room._id });
    }
  });
});

Template.Tech_chat.onRendered(function() {
  // Initialize slimscroll for small chat
  $('.small-chat-box .content').slimScroll({
    height: '234px',
    railOpacity: 0.4,
  });
});

Template.Tech_chat.helpers({
  messages() {
    const room = getMyTechSupportRoom();
    if (!room) return [];
    return Comments.find({ topicId: room._id });
  },
  hasUnreadMessages() {
    const room = getMyTechSupportRoom();
    if (!room) return false;
    return room.unseenCommentsBy(Meteor.userId(), Meteor.users.SEEN_BY_EYES) > 0;
  },
  unreadMessagesCount() {
    const room = getMyTechSupportRoom();
    if (!room) return 0;
    return room.unseenCommentsBy(Meteor.userId(), Meteor.users.SEEN_BY_EYES);
  },
  sideOfMessage(userId) {
    if (userId === Meteor.userId()) return 'right';
    return 'left';
  },
});

Template.Tech_chat.events({
  // Toggle left navigation
  'click .open-small-chat'(event) {
    event.preventDefault();
    $(event.target).closest('a').children().toggleClass('fa-question').toggleClass('fa-times');
    $('.small-chat-box').toggleClass('active');
    const room = getMyTechSupportRoom();
    if (room) Meteor.user().hasNowSeen(room, Meteor.users.SEEN_BY_EYES);
  },
  'click .small-chat-box .js-send'(event, instance) {
    const textarea = instance.find('input');
    const text = textarea.value;
    const communityId = Session.get('activeCommunityId');
    const community = Communities.findOne(communityId);
    const room = getMyTechSupportRoom();
    let roomId;
    const insertMessage = () => {
      Meteor.call('comments.insert', {
        communityId,
        topicId: roomId,
        userId: Meteor.userId(),
        text,
      },
      onSuccess((res) => {
        textarea.value = '';
        // if ($(window).width() > 768) $('.js-focused').focus();
        Meteor.user().hasNowSeen(roomId, Meteor.users.SEEN_BY_EYES);
      }));
    };

    if (room) {
      roomId = room._id;
      insertMessage();
    } else {
      // Create my tech support room
      Meteor.call('topics.insert', {
        communityId,
        userId: Meteor.userId(),
        participantIds: [Meteor.userId(), community.techsupport()._id],
        category: 'room',
        title: 'tech support',
      }, onSuccess((res) => {
        roomId = res;
        insertMessage();
      }),
      );
    }
  },
});