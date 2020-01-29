/* eslint-env mocha */
import { Meteor } from 'meteor/meteor';
import { chai, assert } from 'meteor/practicalmeteor:chai';
import { Fraction } from 'fractional';
import { freshFixture, logDB } from '/imports/api/test-utils.js';
import { moment } from 'meteor/momentjs:moment';
import { Clock } from '/imports/utils/clock.js';
import { Memberships } from '/imports/api/memberships/memberships.js';
import { Bills } from '/imports/api/transactions/bills/bills.js';
import { Transactions } from '/imports/api/transactions/transactions.js';
import { ParcelBillings } from '/imports/api/transactions/parcel-billings/parcel-billings.js';
import { Localizer } from '/imports/api/transactions/breakdowns/localizer.js';
import { Parcels } from '/imports/api/parcels/parcels.js';
import { Partners } from '/imports/api/partners/partners.js';
import { Meters } from '/imports/api/meters/meters.js';

// TODO: import chai-datetime.js -- preferably through npm
// and use equalDate here
// https://www.chaijs.com/plugins/chai-datetime/
chai.assert.equalDate = function equalDate(d1, d2) {
  return chai.assert.equal(moment(d1).format('L'), moment(d2).format('L'));
};

if (Meteor.isServer) {
  let Fixture;

  describe.only('parcel billings', function () {
    this.timeout(15000);
    let applyParcelBilling;
    let communityId;
    let payer3Id;
    let payer4Id;

    before(function () {        
      Fixture = freshFixture();
      communityId = Fixture.demoCommunityId;
      payer3Id = Meteor.users.findOne(Fixture.dummyUsers[3]).partnerId(Fixture.demoCommunityId);
      payer4Id = Meteor.users.findOne(Fixture.dummyUsers[4]).partnerId(Fixture.demoCommunityId);
      applyParcelBilling = function (date) {
        Fixture.builder.execute(ParcelBillings.methods.apply, { communityId, date: new Date(date) }, Fixture.builder.getUserWithRole('accountant'));
      };
    });
    after(function () {
    });

    describe('api', function () {
      let assertBillDetails;
      let assertLineDetails;

      before(function() {
        assertBillDetails = function(bill, expected) {
          chai.assert.equal(bill.partnerId, expected.payerId);
          chai.assert.equal(bill.lines.length, expected.linesLength);
          bill.lines.forEach((line) => {
            if (expected.lineTitle) chai.assert.equal(line.title, expected.lineTitle);
            if (expected.linePeriod) chai.assert.equal(line.period, expected.linePeriod);
          });
        };
        assertLineDetails = function(line, expected) {
          chai.assert.equal(line.uom, expected.uom);
          chai.assert.equal(line.unitPrice, expected.unitPrice);
          chai.assert.equal(line.quantity, expected.quantity);
          chai.assert.equal(line.amount, expected.unitPrice * expected.quantity);
          chai.assert.equal(line.localizer, expected.localizer);
          if (expected.lineTitle) chai.assert.equal(line.title, expected.lineTitle);
          if (expected.linePeriod) chai.assert.equal(line.period, expected.linePeriod);
        };
      });

      beforeEach(function () {
        ParcelBillings.remove({});
        Transactions.remove({});
      });

      it('will not apply inactive parcelBilling', function () {
        Fixture.builder.create('parcelBilling', {
          title: 'Test INACTIVE',
          projection: {
            base: 'absolute',
            unitPrice: 1000,
          },
          digit: '4',
          localizer: '@',
          activeTime: {
            begin: moment().subtract(3, 'day').toDate(),
            end: moment().subtract(1, 'day').toDate(),
          },
        });
        const testParcelBilling = ParcelBillings.findOne({ title: 'Test INACTIVE' });
        chai.assert.isDefined(testParcelBilling);
        chai.assert.isFalse(testParcelBilling.active);

        applyParcelBilling(moment());
        const bills = Transactions.find({ communityId, category: 'bill' }).fetch();
        chai.assert.equal(bills.length, 0);
      });

      it('can apply single billing to all parcels', function () {
        Fixture.builder.create('parcelBilling', {
          title: 'Test area',
          projection: {
            base: 'area',
            unitPrice: 15,
          },
          digit: '3',
          localizer: '@',
        });

        applyParcelBilling('2018-01-12');
        const bills = Transactions.find({ communityId, category: 'bill' }).fetch();
        chai.assert.equal(bills.length, 2);
        assertBillDetails(bills[0], { payerId: payer3Id, linesLength: 3, lineTitle: 'Test area', linePeriod: '2018-01' });
        assertLineDetails(bills[0].lines[0], { uom: 'm2', unitPrice: 15, quantity: 30, localizer: '@A103' });
        assertLineDetails(bills[0].lines[1], { uom: 'm2', unitPrice: 15, quantity: 10, localizer: '@AP01' });
        assertLineDetails(bills[0].lines[2], { uom: 'm2', unitPrice: 15, quantity: 20, localizer: '@AP02' });
        assertBillDetails(bills[1], { payerId: payer4Id, linesLength: 1, lineTitle: 'Test area', linePeriod: '2018-01' });
        assertLineDetails(bills[1].lines[0], { uom: 'm2', unitPrice: 15, quantity: 40, localizer: '@A104' });
      });

      it('can apply billing to a certain floor', function() {
        Fixture.builder.create('parcelBilling', {
          title: 'Test floor',
          projection: {
            base: 'area',
            unitPrice: 25,
          },
          digit: '3',
          localizer: '@A1',
        });

        applyParcelBilling('2018-01-12');
        const bills = Transactions.find({ communityId, category: 'bill' }, { sort: { serial: 1 } }).fetch();
        const payer3 = Partners.findOne(payer3Id);
        chai.assert.equal(bills.length, 2);
        assertBillDetails(bills[0], { payerId: payer3Id, linesLength: 1, lineTitle: 'Test floor', linePeriod: '2018-01' });
        assertLineDetails(bills[0].lines[0], { uom: 'm2', unitPrice: 25, quantity: 30, localizer: '@A103' });
        chai.assert.equal(payer3.outstanding, bills[0].amount);
        assertBillDetails(bills[1], { payerId: payer4Id, linesLength: 1, lineTitle: 'Test floor', linePeriod: '2018-01' });
        assertLineDetails(bills[1].lines[0], { uom: 'm2', unitPrice: 25, quantity: 40, localizer: '@A104' });
      });

      xit('can apply billing to a certain parcel type', function() {
        Fixture.builder.create('parcelBilling', {
          title: 'Type test area',
          projection: {
            base: 'area',
            unitPrice: 100,
          },
          digit: '2',
          // localizer: '@',
          parcelType: 'storage',
        });

        applyParcelBilling('2018-01-12');
        const bills = Transactions.find({ communityId, category: 'bill' }, { sort: { serial: 1 } }).fetch();
        const payer3 = Partners.findOne(payer3Id);
        chai.assert.equal(bills.length, 1);
        assertBillDetails(bills[0], { payerId: payer3Id, linesLength: 1, lineTitle: 'Type test area', linePeriod: '2018-01' });
        assertLineDetails(bills[0].lines[0], { uom: 'm2', unitPrice: 100, quantity: 20, localizer: '@AP02' });
        chai.assert.equal(payer3.outstanding, bills[0].amount);
      });

      it('can apply multiple projections', function () {
        Fixture.builder.create('parcelBilling', {
          title: 'Test volume',
          projection: {
            base: 'volume',
            unitPrice: 50,
          },
          digit: '2',
          localizer: '@A104',
        });
        Fixture.builder.create('parcelBilling', {
          title: 'Test absolute',
          projection: {
            base: 'absolute',
            unitPrice: 1000,
          },
          digit: '4',
          localizer: '@A104',
        });

        applyParcelBilling('2018-01-12');
        const bills = Transactions.find({ communityId, category: 'bill' }).fetch();
        chai.assert.equal(bills.length, 1);
        assertBillDetails(bills[0], { payerId: payer4Id, linesLength: 2, linePeriod: '2018-01' });
        assertLineDetails(bills[0].lines[0], { lineTitle: 'Test volume', uom: 'm3', unitPrice: 50, quantity: 120, localizer: '@A104' });
        assertLineDetails(bills[0].lines[1], { lineTitle: 'Test absolute', uom: 'piece', unitPrice: 1000, quantity: 1, localizer: '@A104' });
      });

      it('can apply consumption based billing', function () {
        Fixture.builder.create('parcelBilling', {
          title: 'Test consumption',
          consumption: {
            service: 'coldWater',
            uom: 'm3',
            unitPrice: 600,
          },
          projection: {
            base: 'habitants',
            unitPrice: 5000,
          },
          digit: '3',
          localizer: '@',
        });

        applyParcelBilling('2018-01-12');
        const parcel4 = Parcels.findOne(Fixture.dummyParcels[4]);
        const bills = Transactions.find({ communityId, category: 'bill' }).fetch();
        chai.assert.equal(bills.length, 1);
        assertBillDetails(bills[0], { payerId: payer4Id, linesLength: 1, lineTitle: 'Test consumption', linePeriod: '2018-01' });
        assertLineDetails(bills[0].lines[0], { uom: 'person', unitPrice: 5000, quantity: 4, localizer: '@A104' });
        chai.assert.equal(parcel4.payerPartner().outstanding, bills[0].lines[0].amount);
        chai.assert.equal(parcel4.outstanding, bills[0].lines[0].amount);

        Transactions.remove({});
        const meteredParcelId = Fixture.dummyParcels[3];
        let meteredParcel = Parcels.findOne(meteredParcelId);
        Fixture.builder.execute(Meters.methods.registerReading, { _id: meteredParcel.meters().fetch()[0]._id, reading: { date: new Date('2018-02-01'), value: 11 } });
        applyParcelBilling('2018-02-12');
        meteredParcel = Parcels.findOne(meteredParcelId);
        const bills2 = Transactions.find({ communityId, category: 'bill' }).fetch();
        chai.assert.equal(bills2.length, 2);
        const billMetered = Transactions.findOne({ category: 'bill', partnerId: meteredParcel.payerPartner()._id });
        assertBillDetails(billMetered, { payerId: payer3Id, linesLength: 1, lineTitle: 'Test consumption', linePeriod: '2018-02' });
        assertLineDetails(billMetered.lines[0], { uom: 'm3', unitPrice: 600, quantity: 11, localizer: '@A103' });
        chai.assert.equal(meteredParcel.payerPartner().outstanding, billMetered.amount);
        chai.assert.equal(meteredParcel.outstanding, billMetered.amount);
      });

      it('bills follower parcel\'s parcel-billing to lead parcel\'s payer', function () {
        Fixture.builder.create('parcelBilling', {
          title: 'One follower parcel',
          projection: {
            base: 'area',
            unitPrice: 15,
          },
          digit: '3',
          localizer: '@AP01',
        });

        applyParcelBilling('2018-01-12');
        const followerParcel = Parcels.findOne(Fixture.dummyParcels[1]);
        const leadParcel = Parcels.findOne(Fixture.dummyParcels[3]);
        const bills = Transactions.find({ communityId, category: 'bill' }).fetch();
        chai.assert.equal(bills.length, 1);
        assertBillDetails(bills[0], { payerId: payer3Id, linesLength: 1, lineTitle: 'One follower parcel', linePeriod: '2018-01' });
        assertLineDetails(bills[0].lines[0], { uom: 'm2', unitPrice: 15, quantity: 10, localizer: '@AP01' });
        chai.assert.equal(bills[0].amount, 150);
        chai.assert.equal(leadParcel.payerPartner().outstanding, bills[0].lines[0].amount);
        chai.assert.equal(followerParcel.outstanding, bills[0].lines[0].amount);
        chai.assert.equal(leadParcel.outstanding, 0);
      });

      it('bills the then owner for given apply date', function () {
        const formerMembershipId = Memberships.findOne({ parcelId: Fixture.dummyParcels[3] })._id;
        Memberships.methods.updateActivePeriod._execute({ userId: Fixture.demoAdminId },
          { _id: formerMembershipId, 
            modifier: { $set: { 'activeTime.begin': moment('2017-12-01').toDate(),
              'activeTime.end': moment('2018-01-31').toDate() } } });
        const laterMembershipId = Fixture.builder.createMembership(Fixture.dummyUsers[2], 'owner', {
          parcelId: Fixture.dummyParcels[3],
          ownership: { share: new Fraction(1, 1) },
        });
        Memberships.methods.updateActivePeriod._execute({ userId: Fixture.demoAdminId },
          { _id: laterMembershipId, modifier: { $set: { 'activeTime.begin': moment('2018-02-01').toDate() } } });
        
        Fixture.builder.create('parcelBilling', {
          title: 'Test absolute',
          projection: {
            base: 'absolute',
            unitPrice: 500,
          },
          digit: '4',
          localizer: '@A103',
        });
        const laterPayerId = Meteor.users.findOne(Fixture.dummyUsers[2]).partnerId(Fixture.demoCommunityId);

        applyParcelBilling('2018-01-12');
        const bills = Transactions.find({ communityId, category: 'bill' }).fetch();
        let parcel = Parcels.findOne(Fixture.dummyParcels[3]);
        let formerPayer = Partners.findOne(payer3Id);
        let laterPayer = Partners.findOne(laterPayerId);
        chai.assert.equal(bills.length, 1);
        assertBillDetails(bills[0], { payerId: payer3Id, linesLength: 1, lineTitle: 'Test absolute', linePeriod: '2018-01' });
        assertLineDetails(bills[0].lines[0], { uom: 'piece', unitPrice: 500, quantity: 1, localizer: '@A103' });
        chai.assert.equal(formerPayer.outstanding, bills[0].amount);
        chai.assert.equal(formerPayer.outstanding, parcel.outstanding);
        chai.assert.equal(laterPayer.outstanding, 0);

        Transactions.remove({});
        applyParcelBilling('2018-03-12');
        const bills2 = Transactions.find({ communityId, category: 'bill' }).fetch();
        parcel = Parcels.findOne(Fixture.dummyParcels[3]);
        formerPayer = Partners.findOne(payer3Id);
        laterPayer = Partners.findOne(laterPayerId);
        chai.assert.equal(bills2.length, 1);
        assertBillDetails(bills2[0], { payerId: laterPayerId, linesLength: 1, lineTitle: 'Test absolute', linePeriod: '2018-03' });
        assertLineDetails(bills2[0].lines[0], { uom: 'piece', unitPrice: 500, quantity: 1, localizer: '@A103' });
        chai.assert.equal(laterPayer.outstanding, bills2[0].amount);
        chai.assert.equal(laterPayer.outstanding, parcel.outstanding);
        chai.assert.equal(formerPayer.outstanding, 0);
      });

      xit('will not apply for same period twice', function () {
        Fixture.builder.create('parcelBilling', {
          title: 'Test area',
          projection: {
            base: 'area',
            unitPrice: 78,
          },
          digit: '3',
          localizer: '@',
        });

        applyParcelBilling('2018-01-12');
        chai.assert.throws(() => applyParcelBilling('2018-01-15'), 'err_alreadyExists');
        // but can apply for a different period
        applyParcelBilling('2018-02-10');
      });
    });

    describe('consumption calculation', function () {
//      let parcelBillingId;
//      let meteredParcelId;
//      let meterId;
      let registerReading;
      let assertBilled;
      before(function () {
        Meters.remove({});
        ParcelBillings.remove({});
        Transactions.remove({});

        const parcelBillingId = Fixture.builder.create('parcelBilling', {
          title: 'Test consumption',
          consumption: {
            service: 'coldWater',
            uom: 'm3',
            unitPrice: 600,
          },
          projection: {
            base: 'habitants',
            unitPrice: 5000,
          },
          digit: '3',
          localizer: '@',
        });
        const meteredParcelId = Fixture.dummyParcels[3];
        const meteredParcel = Parcels.findOne(meteredParcelId);
        const meterId = Fixture.builder.create('meter', {
          parcelId: meteredParcelId,
          identifier: 'CW-01010101',
          service: 'coldWater',
          activeTime: { begin: new Date('2018-01-22') },
        });
        registerReading = function (date, value) {
          Fixture.builder.execute(Meters.methods.registerReading, { _id: meterId, reading: { date: new Date(date), value } });
        };
        assertBilled = function (date, projOrCons, quantity) {
          const bills = Transactions.find({ communityId, category: 'bill', 'lines.localizer': '@'+meteredParcel.ref }).fetch();
          if (!quantity) {
            chai.assert.equal(bills.length, 0);
          } else {
            chai.assert.equal(bills.length, 1);
            const bill = bills[0];
            chai.assert.equalDate(bill.deliveryDate, new Date(date));
            chai.assert.equalDate(bill.issueDate, Clock.currentDate());
            chai.assert.equal(bill.lines.length, 1);
            const line = bill.lines[0];
            if (projOrCons === 'consumption') chai.assert.equal(line.unitPrice, 600);
            else if (projOrCons === 'projection') chai.assert.equal(line.unitPrice, 5000);
            chai.assert.equal(line.quantity, quantity);
          }
        };
      });

      afterEach(function () {
        Transactions.remove({});
      });

      it('Can bill for before the meter was installed -> charged by projection', function () {
        applyParcelBilling('2018-01-12');
        assertBilled('2018-01-12', 'projection', 3);
      });

      it('Can bill a fresh meter -> no charge', function () {
        applyParcelBilling('2018-02-12');
        assertBilled('2018-02-22', 'consumption', 0);
      });

      it('Can bill a reading', function () {
        registerReading('2018-03-01', 10);
        applyParcelBilling('2018-03-22');
        assertBilled('2018-03-22', 'consumption', 10);
      });

      xit('Cannot accidentally bill for same period twice', function () {
        chai.assert.throws(() => {
          applyParcelBilling('2018-03-24');
        }, 'err_alreadyExists');
        assertBilled('2018-03-24', 'consumption', 0);
      });
    });
/*
    xdescribe('apply', function () {
      before(function () {
      });

      xit('calculates correctly per volume', function () {
        const parcelBillingId = Fixture.builder.create('parcelBilling', {
          valueDate: new Date(),
          projection: 'volume',
          projectedPrice: 78,
          digit: '5',
          localizer: '@',
          note: 'Test volume',
        });
        const testParcelBilling = ParcelBillings.findOne(parcelBillingId);
        const transaction = Transactions.findOne({ note: 'Test volume' });
        transaction.debit.forEach((leg) => {
          const parcel = Parcels.findOne({ communityId: transaction.communityId, ref: Localizer.code2parcelRef(leg.localizer) });
          const neededSum = Math.round(parcel.volume * testParcelBilling.projectedPrice);
          chai.assert.equal(leg.amount, neededSum);
        });
        const parcelBillingTotal = transaction.amount;
        const parcelBillingDebitSum = transaction.debit.map(leg => leg.amount).reduce((partialsum, next) => partialsum + next);
        chai.assert.equal(parcelBillingTotal, parcelBillingDebitSum);
      });

      xit('calculates correctly per habitants', function () {
        let habitants = 1;
        Fixture.dummyParcels.forEach((parcel) => {
          Parcels.update(parcel, { $set: { habitants }});
          habitants += 1;
        });
        const parcelBillingId = Fixture.builder.create('parcelBilling', {
          valueDate: new Date(),
          projection: 'habitants',
          projectedPrice: 155,
          digit: '6',
          localizer: '@',
          note: 'Test habitants',
        });
        const testParcelBilling = ParcelBillings.findOne(parcelBillingId);
        const transaction = Transactions.findOne({ note: 'Test habitants' });
        transaction.debit.forEach((leg) => {
          const parcel = Parcels.findOne({ communityId: transaction.communityId, ref: Localizer.code2parcelRef(leg.localizer) });
          const neededSum = Math.round(testParcelBilling.projectedPrice * parcel.habitants);
          chai.assert.equal(leg.amount, neededSum);
        });
        const parcelBillingTotal = transaction.amount;
        const parcelBillingDebitSum = transaction.debit.map(leg => leg.amount).reduce((partialsum, next) => partialsum + next);
        chai.assert.equal(parcelBillingTotal, parcelBillingDebitSum);
      });
    });

    xdescribe('value date', function () {
      xit('writes transactions for the right date', function () {
      });
    });

    xdescribe('no values given', function () {
      before(function () {
        const parcelId = Parcels.insert({ communityId: Fixture.demoCommunityId, ref: 'A89', building: 'A', floor: 8, door: 9, units: 20 });
        const extraParcel = Parcels.findOne(parcelId);
        Localizer.addParcel(Fixture.demoCommunityId, extraParcel, 'en');
      });

      it('does not brake when area is missing', function () {
        const parcelBillingId = Fixture.builder.create('parcelBilling', {
          valueDate: new Date(),
          projection: 'area',
          projectedPrice: 78,
          digit: '4',
          localizer: '@',
          note: 'one area is missing',
        });
        const testParcelBilling = ParcelBillings.findOne(parcelBillingId);
        const transaction = Transactions.findOne({ note: 'one area is missing'});
        transaction.debit.forEach((leg) => {
          const parcel = Parcels.findOne({ communityId: transaction.communityId, ref: Localizer.code2parcelRef(leg.localizer) });
          const neededSum = Math.round(testParcelBilling.projectedPrice * parcel.area || 0);
          chai.assert.equal(leg.amount, neededSum);
        });
        const parcelBillingTotal = transaction.amount;
        const parcelBillingDebitSum = transaction.debit.map(leg => leg.amount).reduce((partialsum, next) => partialsum + next);
        chai.assert.equal(parcelBillingTotal, parcelBillingDebitSum);
        const parcelNumber = Parcels.find({ communityId: Fixture.demoCommunityId }).count(); 
        const debitLegs = transaction.debit.length;
        chai.assert.equal(parcelNumber, debitLegs);
      });
      
      it('does not brake when volume is missing', function () {
        const parcelBillingId = Fixture.builder.create('parcelBilling', {
          valueDate: new Date(),
          projection: 'volume',
          projectedPrice: 78,
          digit: '4',
          localizer: '@',
          note: 'one volume is missing',
        });
        const testParcelBilling = ParcelBillings.findOne(parcelBillingId);
        const transaction = Transactions.findOne({ note: 'one volume is missing'});
        transaction.debit.forEach((leg) => {
          const parcel = Parcels.findOne({ communityId: transaction.communityId, ref: Localizer.code2parcelRef(leg.localizer) });
          const neededSum = Math.round(testParcelBilling.projectedPrice * parcel.volume || 0);
          chai.assert.equal(leg.amount, neededSum);
        });
        const parcelBillingTotal = transaction.amount;
        const parcelBillingDebitSum = transaction.debit.map(leg => leg.amount).reduce((partialsum, next) => partialsum + next);
        chai.assert.equal(parcelBillingTotal, parcelBillingDebitSum);
        const parcelNumber = Parcels.find({ communityId: Fixture.demoCommunityId }).count(); 
        const debitLegs = transaction.debit.length;
        chai.assert.equal(parcelNumber, debitLegs);
      });

      it('does not brake when habitants are missing', function () {
        const parcelBillingId = Fixture.builder.create('parcelBilling', {
          valueDate: new Date(),
          projection: 'habitants',
          projectedPrice: 140,
          digit: '1',
          localizer: '@',
          note: 'one habitant is missing',
        });
        const testParcelBilling = ParcelBillings.findOne(parcelBillingId);
        const transaction = Transactions.findOne({ note: 'one habitant is missing'});
        transaction.debit.forEach((leg) => {
          const parcel = Parcels.findOne({ communityId: transaction.communityId, ref: Localizer.code2parcelRef(leg.localizer) });
          const neededSum = Math.round(testParcelBilling.projectedPrice * parcel.habitants || 0);
          chai.assert.equal(leg.amount, neededSum);
        });
        const parcelBillingTotal = transaction.amount;
        const parcelBillingDebitSum = transaction.debit.map(leg => leg.amount).reduce((partialsum, next) => partialsum + next);
        chai.assert.equal(parcelBillingTotal, parcelBillingDebitSum);
        const parcelNumber = Parcels.find({ communityId: Fixture.demoCommunityId }).count(); 
        const debitLegs = transaction.debit.length;
        chai.assert.equal(parcelNumber, debitLegs);
      });

      it('does not brake when building/floor/door is missing', function () {
        const parcelId2 = Parcels.insert({ communityId: Fixture.demoCommunityId, ref: 'A75', units: 20 });
        const parcelWithoutDetails = Parcels.findOne(parcelId2);
        Localizer.addParcel(Fixture.demoCommunityId, parcelWithoutDetails, 'en');
        const parcelBillingId = Fixture.builder.create('parcelBilling', {
          valueDate: new Date(),
          projection: 'absolute',
          amount: 150,
          digit: '3',
          localizer: '@',
          note: 'no parcel details',
        });
        const testParcelBilling = ParcelBillings.findOne({ note: 'no parcel details' });
        Parcels.find({ communityId: Fixture.demoCommunityId }).count();
        const parcelNumber = Parcels.find({ communityId: Fixture.demoCommunityId }).count();
        const debitLegs = Transactions.findOne({ note: 'no parcel details'}).debit.length;
        chai.assert.equal(parcelNumber, debitLegs);
      });

    });
  */
  });
}
