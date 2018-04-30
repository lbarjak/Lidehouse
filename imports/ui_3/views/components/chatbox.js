import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { moment } from 'meteor/momentjs:moment';
import { TimeSync } from 'meteor/mizzao:timesync';
import { __ } from '/imports/localization/i18n.js';
import { Comments } from '/imports/api/comments/comments.js';
import { like } from '/imports/api/comments/methods.js';
import { remove as removeTopic } from '/imports/api/topics/methods.js';
import { Modal } from 'meteor/peppelg:bootstrap-3-modal';
import '/imports/ui_2/modals/modal.js';
import '/imports/ui_2/modals/confirmation.js';
import '../components/chatbox.html';
import '../components/comments-section.js';

Template.Chatbox.onRendered(function chatboxOnRendered() {
});

Template.Chatbox.helpers({
  avatar() {
    return Meteor.users.findOne(this.userId).avatar;
  },
  displayUser() {
    return Meteor.users.findOne(this.userId).fullName();
  },
  comments() {
    return Comments.find({ topicId: this._id }, { sort: { createdAt: 1 } });
  },
  userLikesThis() {
    const topic = this;
    return topic.isLikedBy(Meteor.userId());
  },
});

Template.Chatbox.events({
  'click .js-edit'(event, instance) {
    // TODO: Make the text field editable, display a send button, when clicked, call updateTopic, hide editable field
  },
  'click .js-delete'(event, instance) {
    Modal.confirmAndCall(removeTopic, { _id: this._id }, {
      action: 'delete topic',
      message: 'It will disappear forever',
    });
  },
  'click .js-hide'(event, instance) {
    const modalContext = {
      title: __('Not implemented yet'),
      btnClose: 'close',
    };
    Modal.show('Modal', modalContext);
  },
  'click .js-report'(event, instance) {
    const modalContext = {
      title: __('Not implemented yet'),
      btnClose: 'close',
    };
    Modal.show('Modal', modalContext);
  },
  'click .js-like'(event) {
    Meteor.call('like', {
      coll: 'topics',
      id: this._id,
      userId: Meteor.userId(),
    });
  },
});
