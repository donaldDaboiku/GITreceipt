const DB_NAME = "EstateReceiptDB";
const DB_VERSION = 1;
const STORE_NAME = "receipts";

let db;

function initDB() {

    return new Promise((resolve, reject) => {

        const request =
            indexedDB.open(
                DB_NAME,
                DB_VERSION
            );

        request.onupgradeneeded = function(e){

            db = e.target.result;

            if(
                !db.objectStoreNames.contains(
                    STORE_NAME
                )
            ){

                db.createObjectStore(
                    STORE_NAME,
                    {
                        keyPath:"receiptNo"
                    }
                );
            }
        };

        request.onsuccess = function(e){

            db = e.target.result;

            resolve();
        };

        request.onerror = function(){

            reject(
                "Database failed to open"
            );
        };
    });
}

function saveReceipt(receipt){

    return new Promise((resolve)=>{

        const tx =
            db.transaction(
                STORE_NAME,
                "readwrite"
            );

        tx.objectStore(STORE_NAME)
            .put(receipt);

        tx.oncomplete = () => resolve();
    });
}

function getReceipt(receiptNo){

    return new Promise((resolve)=>{

        const tx =
            db.transaction(
                STORE_NAME,
                "readonly"
            );

        const request =
            tx.objectStore(STORE_NAME)
              .get(receiptNo);

        request.onsuccess =
            () => resolve(request.result);
    });
}

function getAllReceipts(){

    return new Promise((resolve)=>{

        const tx =
            db.transaction(
                STORE_NAME,
                "readonly"
            );

        const request =
            tx.objectStore(STORE_NAME)
              .getAll();

        request.onsuccess =
            () => resolve(request.result);
    });
}

function deleteReceipt(receiptNo){

    return new Promise((resolve)=>{

        const tx =
            db.transaction(
                STORE_NAME,
                "readwrite"
            );

        tx.objectStore(STORE_NAME)
          .delete(receiptNo);

        tx.oncomplete =
            () => resolve();
    });
}