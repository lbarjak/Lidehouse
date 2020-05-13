import { _ } from 'meteor/underscore';
import { Session } from 'meteor/session';

import { debugAssert, productionAssert } from '/imports/utils/assert.js';
import { Communities } from '/imports/api/communities/communities.js';
import { Parcels } from '/imports/api/parcels/parcels';
import { Parcelships } from '/imports/api/parcelships/parcelships.js';
import { Partners } from '/imports/api/partners/partners.js';
import { Memberships } from '/imports/api/memberships/memberships.js';
import { Accounts } from '/imports/api/transactions/accounts/accounts.js';
import { Transactions } from '/imports/api/transactions/transactions.js';
import { Txdefs } from '/imports/api/transactions/txdefs/txdefs.js';

import { Translator } from './translator.js';

// Multiple collections can be imported with one import command

export function getCollectionsToImport(collection, options) {
  switch (collection._name) {
    case 'parcels': {
      return [{
        collection: Parcels,
        schema: Parcels.simpleSchema({ category: '@property' }),
        translator: new Translator(Parcels, options, 'hu', {
          category: { default: '@property' },
        }),
      }, {
        collection: Parcelships,
        schema: Parcelships.simpleSchema(),
        translator: new Translator(Parcelships, options, 'hu'),
      }, {
        collection: Partners,
        schema: Partners.simpleSchema(),
        translator: new Translator(Partners, options, 'hu', {
          relation: { default: ['member'] },
          idCard: { type: { default: 'natural' } },
        }),
      }, {
        collection: Memberships,
        schema: Memberships.simpleSchema({ role: 'owner' }),
        omitFields: ['partnerId', 'ownership.representor'],
        translator: new Translator(Memberships, options, 'hu', {
          role: { default: 'owner' },
          ownership: { default: { share: '1/1' } },
        }),
      }];
    }
    case 'transactions': {
      return [{
        collection: Partners,
        schema: Partners.simpleSchema(),
        translator: new Translator(Partners, options, 'hu', {
          relation: { default: ['supplier'] },
          idCard: {
            type: { default: 'legal' },
            name: { label: 'Szállító neve adóigazgatási azonosító száma' },
          },
        }),
      }, {
        collection: Transactions,
        schema: Transactions.simpleSchema({ category: 'bill' }),
        translator: new Translator(Transactions, options, 'hu', {
          category: { default: 'bill' },
          relation: { default: Session.get('activePartnerRelation') },
          serialId: { formula: "'SZ/SZALL/IMP/' + index" },
          defId: Txdefs.findOne({ communityId: Session.get('activeCommunityId'), category: 'bill', 'data.relation': Session.get('activePartnerRelation') }),
          partnerId: { label: 'Szállító neve adóigazgatási azonosító száma' },
          valueDate: { label: 'Számla kelte' },
          dueDate: { label: 'A számla fizetési határideje' },
          'lines.0.title': { label: 'Számla száma, vevőkód, fogy hely azonosító' },
          'lines.0.uom': { default: 'piece' },
          'lines.0.quantity': { default: 1 },
          'lines.0.unitPrice': { label: 'Számla összege' },
          // debit is one of the '8' accounts
          credit: { default: [{ account: '`454' }] },
          status: { default: 'posted' },
          postedAt: { formula: 'doc.valueDate' },
        }),
      }, {
        collection: Transactions,
        schema: Transactions.simpleSchema({ category: 'payment' }),
        translator: new Translator(Transactions, options, 'hu', {
          category: { default: 'payment' },
          relation: { default: Session.get('activePartnerRelation') },
          serialId: { formula: "'FIZ/SZALL/IMP/' + index" },
          defId: Txdefs.findOne({ communityId: Session.get('activeCommunityId'), category: 'payment', 'data.relation': Session.get('activePartnerRelation') }),
          partnerId: { label: 'Szállító neve adóigazgatási azonosító száma' },
          valueDate: { label: 'A számla kiegyenlítésének időpontja' },
          amount: { label: 'Számla összege' },
//          amount: { label: 'A számla kiegyenlítésének összege' },
          debit: { default: [{ account: '`454' }] },
        }),
      }];
    }
    case 'statementEntries': {
      const account = Accounts.findOne({ communityId: options.communityId, code: options.account });
      const dictionary = {
        account: { default: options.account },
        statementId: { default: options.source },
      };
      switch (account.bank) {
        case 'K&H': {
//            productionAssert(options.account.code === Import.findAccountByNumber(doc['Könyvelési számla']).code, 'Bank account mismatch on bank statement');
          _.extend(dictionary, {
            ref: { label: 'Tranzakció azonosító' },
            refType: { label: 'Típus' },
            valueDate: { label: 'Könyvelés dátuma' },
            amount: { label: 'Összeg' },
            name: { label: 'Partner elnevezése' },
            note: { label: 'Közlemény' },
          });
          break;
        }
        case undefined: {
          productionAssert(account.category === 'cash');
          _.extend(dictionary, {
            ref: { label: 'Sorszám' },
            refType: { depends: ['Bevétel', 'Kiadás'], formula: "(doc['Bevétel'] && 'Bevétel') || (doc['Kiadás'] && 'Kiadás')" },
            valueDate: { label: 'Dátum' },
            amount: { depends: ['Bevétel', 'Kiadás'], formula: "doc['Bevétel'] || (doc['Kiadás'] * -1)" },
            name: { label: 'Név' },
            note: { label: 'Bizonylatszám (1)' },
          });
          break;
        }
        default: productionAssert(false, `No protocol for bank ${account.bank}`);
      }
      return [{
        collection,
        schema: collection.simpleSchema(),
        translator: new Translator(collection, options, 'hu', dictionary),
      }];
    }
    default: return [{
      collection,
      schema: collection.simpleSchema(),
      translator: new Translator(collection, options, 'hu'),
    }];
  }
}
