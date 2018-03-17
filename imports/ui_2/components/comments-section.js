/* globals document */
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { moment } from 'meteor/momentjs:moment';
import { TimeSync } from 'meteor/mizzao:timesync';

import { Comments } from '/imports/api/comments/comments.js';
import { Topics } from '/imports/api/topics/topics.js';

import '../components/comments-section.html';

Template.Comments_section.onCreated(function commentsSectionOnCreated() {
  this.autorun(() => {
    this.subscribe('comments.onTopic', { topicId: this.data.topicId });
  });
});

Template.Comments_section.helpers({
  isVote() {
    const topic = Topics.findOne(this.topicId);
    return topic.category === 'vote';
  },
  likesCount() {
    const topic = Topics.findOne(this.topicId);
    return topic.likesCount();
  },
  userLikesThis() {
    const topic = Topics.findOne(this.topicId);
    return topic.isLikedBy(Meteor.userId());
  },
  count() {
    return Comments.find({ topicId: this.topicId }).count();
  },
  comments() {
    return Comments.find({ topicId: this.topicId });
  },
  selfAvatar() {
    return Meteor.user().avatar;
  },
});

Template.Comment.helpers({
  avatar() {
    return this.user().avatar;
  },
  displayUser() {
    return this.user().fullName();
  },
  displayTimeSince() {
    // momentjs is not reactive, but TymeSync call makes this reactive
    const serverTimeNow = new Date(TimeSync.serverTime());
    return moment(this.createdAt).from(serverTimeNow);
  },
});

Template.Comments_section.events({
  'click .js-send-comment'(event) {
    Meteor.call('comments.insert', {
      topicId: this.topicId,
      userId: Meteor.userId(),
      text: document.getElementById('text_' + this.topicId).value,
    });
    document.getElementById('text_' + this.topicId).value = '';
  },
  'click .js-like'(event) {
    Meteor.call('like', {
      coll: 'topics',
      id: this.topicId,
      userId: Meteor.userId(),
    });
  },
});
