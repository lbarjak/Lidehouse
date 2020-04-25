/* eslint-disable quotes, quote-props, comma-dangle */

export const HouseTranslation = {

  en:
  {
    "community": "building",
    "Join a community": "Join a building",
    "Create a community": "Create a building",
    "Community finder note": "If you create a new building, you will be its Administrator.",
    "Community finder text": ["Here you can see the houses created in our system that receive new members. ",
       "If you find your house in the list and are not yet a member of the community, you can submit a request to join on the house page, which can be approved by the house's executives. ",
       "If your house is not already in your system, you can create it and invite your housemates to join."],

    "centralHeating": "Central heating",
    "ownHeating": "Own heating system",

    "schemaCommunities": {
      "name": {
        "label": "Name of the Building",
        "placeholder": "(eg. Marina Gardens)"
      },
      "description": {
        "label": "Description",
        "placeholder": "(eg. The most colourful building in the street.)"
      },
      "avatar": {
        "label": "Image",
        "placeholder": "File link (eg. https://imgbb.com/pic.jpg)"
      },
      "zip": {
        "label": "Zip code",
        "placeholder": "(eg. 1089)"
      },
      "city": {
        "label": "City",
        "placeholder": "(eg. Budapest)"
      },
      "street": {
        "label": "Street",
        "placeholder": "(eg. Tulip street or Heros square)"
      },
      "number": {
        "label": "House number",
        "placeholder": "(eg. 101 or 25/B)"
      },
      "lot": {
        "label": "Lot number",
        "placeholder": "(eg. 29732/9)"
      },
      "parcelRefFormat": {
        "label": "Parcel ref format",
        "placeholder": "(eg. F/D means Floor/Door)"
      },
      "management": {
        "label": "Contact info of management",
        "placeholder": "(eg. office address, phone, opening hours)",
        "help": "You can set some some text here freely and it will be displayed for everybody, not just for the members of this community. You can provide contact information here for outsiders."
      },
      "taxNo": {
        "label": "Tax number",
        "placeholder": "(eg. international VAT number)",
        "help": "Not mandatory, but you can set this, if you'd like it to appear on invoices and bills."
      },
      "totalunits": {
        "label": "Total shares outstanding",
        "placeholder": "(eg. 10000)"
      },
      "settings": {
        "label": "Settings",
        "modules": {
          "label": "Modules activated",
          "options": {
            "forum": "Forum",
            "voting": "Decsion making",
            "maintenance": "Maintenance",
            "finances": "Finaces",
            "documents": "Documentstore"
          }
        },
        "joinable": {
          "label": "Accepts join requests",
          "help": "If you are not providing all parcel owner's data yourself, and you'd like them to be able to join the community, providing their own data, allow this option. Before approving a join request, you can still edit the submitted data.",
        },
        "language": {
          "label": "Language",
          "help": "The official language of the community. (Users receive their notifications translated to their own language.)"
        },
        "parcelRefFormat": {
          "label": "Parcel reference format",
          "placeholder": "(eg. bfdd)",
          "help": "If a format is supplied, then the building, floor, door data can be calculated from the parcel reference. For example bfdd means the first character is the building, the second is the floor, and the 3rd-4th is the door number, so B108 is used for building B, first floor, door 8."
        },
        "topicAgeDays": {
          "label": "Topic ageing days",
          "help": "Topics get automatically closed after this many days of inactivity."
        },
        "accountingMethod": {
          "label": "Accounting method",
          "help": "Depending on this, the accounting transactions are generated differently from bills and payments. Never change this setting during the fiscal year.",
          "accrual": "Accrual",
          "cash": 'Cash'
        }
      }
    },
    "schemaParcels": {
      "label": "Parcel",
      "category": {
        "label": "Category",
        "@property": "Property",
        "@common": "Common area",
        "@group": "Group",
        "#tag": "Hashtag"
      },
      "serial": {
        "label": "Serial no.",
        "placeholder": "(eg. 34)",
        "help": "The serial number of the property. An integer that grows, and lets you sort your list."
      },
      "ref": {
        "label": "Reference",
        "placeholder": "(eg. B405 or II/4)",
        "help": "An abritrary but unique reference within the community"
      },
      "leadRef": {
        "label": "Lead parcel",
        "placeholder": "(eg. K108)"
      },
      "code": {
        "label": "Accounting code",
        "placeholder": "(eg. @B for building B)",
        "help": "The accounting code can be anz unique character sequence. When codes share the same beginning sequence, they are sub-codes of that parent code. We recommend using using @ for physical location, and then follw with a convention like, bulding, floor, door. If you don't supply a code, the system will use the ref as the accounting code."
      },
      "units": {
        "label": "Voting share units",
        "placeholder": "(eg. 135)"
      },
      "building": {
        "label": "Building",
        "placeholder": "(eg. F)"
      },
      "floor": {
        "label": "Floor",
        "placeholder": "(eg. 4 or IV)"
      },
      "door": {
        "label": "Door",
        "placeholder": "24"
      },
      "type": {
        "label": "Type",
        "placeholder": "(eg. Apartment)",
        "flat": "Apartment",
        "parking": "Parking",
        "storage": "Storage",
        "cellar": "Cellar",
        "attic": "Attic",
        "shop": "Shop",
        "office": "Office",
        "other": "Other"
      },
      "group": {
        "label": "Group",
        "help": "Arbitrary tag to identify which group of parcels it belongs to. Can be used in parcel billings.",
        "placeholder": "(eg. HasWaterMeter)"
      },
      "lot": {
        "label": "Lot No.",
        "placeholder": "(eg. 293457/A/21)"
      },
      "location": {
        "label": "Location"
      },
      "area": {
        "label": "Area (m2)",
        "placeholder": "(eg. 45)"
      },
      "volume": {
        "label": "Volume (m3)",
        "placeholder": "(eg. 142)"
      },
      "habitants": {
        "label": "Habitants",
        "placeholder": "(eg. 4)"
      },
      "occupants": {
        "label": "Occupants"
      },
      "freeFields": {
        "label": "Free fields",
        "$": {
          "key": {
            "label": "Field name",
            "placeholder": "(pl. Height)"
          },
          "value": {
            "label": "Field value",
            "placeholder": "(eg. 3.5m)"
          }
        }
      }
    }
  },

  hu:
  {
    "community": "ház",
    "Community finder": "Házkereső",
    "Join a community": "Csatlakozás egy házhoz",
    "Create a community": "Létrehozok egy házat",
    "Community finder note": "Ha létrehoz egy új közösséget, ön lesz az Adminisztrátor!",
    "Community finder text": ["Itt láthatja azokat a rendszerünkben létrehozott házakat, melyek fogadnak még új tagokat. ",
      "Ha megtalálja saját házát a listában és még nem tagja a közösségnek, a ház adatlapján csatlakozási kérelmet adhat be, melyet a ház vezetői hagyhatnak jóvá. ",
      "Ha a háza még nem található meg a rendszerben, akkor létrehozhatja azt és meghívhatja lakótársait is, hogy csatlakozzanak."],

    "Parcels of community": "A házhoz tartozó albetétek",
    "Community page": "Házlap",

    "centralHeating": "Központi fűtés",
    "ownHeating": "Saját fűtés",

    "ownership proportion": "tulajdoni hányad",

    "schemaCommunities": {
      "name": {
        "label": "Társasház neve",
        "placeholder": "(pl. Rózsakert lakópark vagy Kankalin u 45)"
      },
      "description": {
        "label": "Leírás",
        "placeholder": "(pl. Az utca legszínesebb háza.)"
      },
      "avatar": {
        "label": "Fénykép",
        "placeholder": "Link megadása (pl. https://imgbb.com/kajol-lak.jpg)"
      },
      "zip": {
        "label": "Irányító szám",
        "placeholder": "(pl. 1034)"
      },
      "city": {
        "label": "Város",
        "placeholder": "(pl. Budapest)"
      },
      "street": {
        "label": "Utca/közterület",
        "placeholder": "(pl. Kankalin u. vagy Zsigmond tér)"
      },
      "number": {
        "label": "Házszám",
        "placeholder": "(pl. 101 vagy 25/B)"
      },
      "lot": {
        "label": "Helyrajzi szám",
        "placeholder": "(pl. 29732/9)"
      },
      "parcelRefFormat": {
        "label": "Albetét azonosító formátuma",
        "placeholder": "(pl. F/D azt jelenti Emelet/Ajto)"
      },
      "totalunits": {
        "label": "Összes tulajdoni hányad",
        "placeholder": "(pl. 1000 vagy 9999)"
      },
      "management": {
        "label": "Közös képviselet elérhetősége",
        "placeholder": "(pl. iroda címe, telefonszáma, nyitvatartása)",
        "help": "Az itt megadott szabad szöveges információt mindenki láthatja, nem csak a tulajdonosok. Itt adhat meg külsősök számára elérhetőségeket."
      },
      "taxNo": {
        "label": "Adószám",
        "placeholder": "(pl. 123456-2-42)",
        "help": "Nem szükséges megadni, csak ha szeretné hogy a számlákon fel legyen tüntetve."
      },
      "settings": {
        "label": "Beállítások",
        "modules": {
          "label": "Modulok aktiválva",
          "options": {
            "forum": "Fórum",
            "voting": "Döntéshozás",
            "maintenance": "Üzemeltetés",
            "finances": "Pénzügyek",
            "documents": "Dokumentumtár"
          }
        },
        "joinable": {
          "label": "Csatlakozási kérelmeket fogad",
          "help": "Ha nem ön viszi fel az összes tulajdonosi adatot, hanem szeretné engedni hogy a tulajdonosok maguktól, adataik megadásával csatlakozzanak, akkor engedélyezze. A csatlakozási kérelemben megadott albetét adatokat ön tudja még módosítani, mielőtt jóváhagyja azokat."
        },
        "language": {
          "label": "Nyelv",
          "help": "A közösség hivatalos nyelve. (A felhasználók a számukra küldött értesítőket a saját nyelvükre lefordítva kapják meg.)"
        },
        "parcelRefFormat": {
          "label": "Albetét azonosító formátuma",
          "placeholder": "(pl bfdd)",
          "help": "Ha van megadva formátum, akkor az albetét azonosítóból automatikusan kinyerhetők az épület, emelet, ajtó adatok. A bfdd például at jelenti, az elso karakter az épület, a második az emelet, a harmadik-negyedik pedig az ajtó, azaz B108 jelölli a B épület első emelet 8-as lakást."
        },
        "topicAgeDays": {
          "label": "Témák elöregedése napokban",
          "help": "A témák automatikusan lezárulnak ennyi nap inaktivitás után."
        },
        "accountingMethod": {
          "label": "Könyvelési mód",
          "help": "A könyvelési mód - egyszeres (pénzforgalmi) vagy kettős - határozza meg mikor jönnek létre könyvelési tranzakciók a számlákból (befogadáskor vagy kifizetéskor). A könyvelési módot év közben semmiképpen nem szabad megváltoztatni.",
          "accrual": "Kettős könyvvitel",
          "cash": "Egyszeres (pénzforgalmi) könyvvitel"
        }
      }
    },
    "schemaParcels": {
      "label": "Albetét",
      "category": {
        "label": "Kategória",
        "@property": "Albetét",
        "@common": "Közös tulajdon",
        "@group": "Gyűjtő",
        "#tag": "Elszámolási egység"
      },
      "serial": {
        "label": "Sorszám",
        "placeholder": "(pl. 34)",
        "help": "Egyedi sorszám, mely segít sorba rendezni a helyeinket. A helyrajzi szám utolsó száma például kíválóan alkalmas erre."
      },
      "ref": {
        "label": "Albetét",
        "placeholder": "(pl. B405 vagy II/4)",
        "help": "Egyedi név, mellyel hivatkozni lehet erre a helyre"
      },
      "leadRef": {
        "label": "Vezető albetét",
        "placeholder": "(pl. K108)"
      },
      "code": {
        "label": "Könyvelési kód",
        "placeholder": "(pl. @B a B épülethez)",
        "help": "A könyvelési kód tetszőleges karakter sorozat lehet. Ha nem ad meg kódot, akkor a @+'Elnevezést' fogja használni a rendszer könyvelési kódnak. Amikor azonos karakterekkel kezdődik egy másik kód, akkor az az al-kódja a másik helynek, ezzel lehet hierarchiába rendezni a helyeinket. Érdemes ezért konvenciót használni, mint pl @ jelöli a fizikai helyeket, és ezt követheti az épület, az emelet majd az ajtó kódja."
      },
      "units": {
        "label": "Tulajdoni hányad",
        "placeholder": "(pl. 135)"
      },
      "building": {
        "label": "Épület",
        "placeholder": "(pl. K)"
      },
      "floor": {
        "label": "Emelet",
        "placeholder": "(pl. 4 vagy IV)"
      },
      "door": {
        "label": "Ajtó",
        "placeholder": "(pl. 24)"
      },
      "type": {
        "label": "Típus",
        "placeholder": "(pl. Lakás)",
        "flat": "Lakás",
        "parking": "Parkoló",
        "storage": "Tároló",
        "cellar": "Pince",
        "attic": "Padlás",
        "shop": "Üzlet",
        "office": "Iroda",
        "other": "Egyéb"
      },
      "group": {
        "label": "Csoport",
        "help": "Tetszőleges szó, ami azonosítja melyik csoportba tartozik ez az albetét. Az előrásoknál lehet a csoport szerint szűrni.",
        "placeholder": "(pl. Vízórás)"
      },
      "lot": {
        "label": "Helyrajzi szám",
        "placeholder": "(pl. 293456/A/24)"
      },
      "location": {
        "label": "Elhelyezkedés"
      },
      "area": {
        "label": "Alapterület (m2)",
        "placeholder": "(pl. 45)"
      },
      "volume": {
        "label": "Légköbméter (m3)",
        "placeholder": "(pl. 142)"
      },
      "habitants": {
        "label": "Lakók száma (fő)"
      },
      "occupants": {
        "label": "Birtokosok"
      },
      "freeFields": {
        "label": "Kötetlen mezők",
        "$": {
          "key": {
            "label": "Megnevezés",
            "placeholder": "(pl. Belmagasság)"
          },
          "value": {
            "label": "Érték",
            "placeholder": "(pl. 3,5m)"
          }
        }
      }
    }
  }
};
