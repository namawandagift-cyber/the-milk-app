//*******************************************************
 
const CONFIG = {
  SESSION_DURATION_MS: 30 * 24 * 60 * 60 * 1000,
  SALT: 'DairyPulseSecureUganda2026Salt',
  TIMEZONE: 'Africa/Kampala'
};


/* =====================================================
   DATABASE SCHEMAS
   ===================================================== */

const SCHEMAS = {
  Users: [
    'userId',
    'fullName',
    'email',
    'passwordHash',
    'farmId',
    'createdAt',
    'updatedAt',
    'status'
  ],

  Farms: [
    'farmId',
    'ownerId',
    'farmName',
    'location',
    'farmPhotoUrl',
    'cowCount',
    'mainMilkBuyer',
    'createdAt',
    'updatedAt'
  ],

  Cows: [
    'cowId',
    'farmId',
    'cowNumber',
    'name',
    'breed',
    'dateOfBirth',
    'status',
    'photoUrl',
    'notes',
    'createdAt',
    'updatedAt'
  ],

  MilkRecords: [
    'recordId',
    'farmId',
    'recordDate',
    'morningLitres',
    'eveningLitres',
    'totalLitres',
    'notes',
    'createdBy',
    'createdAt',
    'updatedAt'
  ],

  Expenses: [
    'expenseId',
    'farmId',
    'expenseDate',
    'category',
    'description',
    'amount',
    'notes',
    'createdBy',
    'createdAt',
    'updatedAt'
  ],

  Buyers: [
    'buyerId',
    'farmId',
    'name',
    'phone',
    'location',
    'createdAt',
    'updatedAt'
  ],

  Sales: [
    'saleId',
    'farmId',
    'buyerId',
    'saleDate',
    'litres',
    'pricePerLitre',
    'totalAmount',
    'amountPaid',
    'amountDue',
    'notes',
    'createdBy',
    'createdAt',
    'updatedAt'
  ],

  Activity: [
    'activityId',
    'farmId',
    'userId',
    'action',
    'description',
    'timestamp'
  ],

  Sessions: [
    'sessionToken',
    'userId',
    'farmId',
    'expiresAt',
    'createdAt'
  ]
};


/* =====================================================
   HTTP
   ===================================================== */

function doGet(e) {
  return createJsonResponse({
    success: true,
    message: 'DairyPulse Apps Script API is active. Send POST requests with action and sessionToken.',
    timestamp: new Date().toISOString()
  });
}


function doPost(e) {
  try {
    let payload = {};

    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action;
    const sessionToken = payload.sessionToken;
    const data = payload.data || {};

    if (!action) {
      return createJsonResponse({
        success: false,
        message: 'Missing API action.'
      });
    }


    /* PUBLIC ACTIONS */

    if (action === 'initializeDatabase') {
      return handleInitializeDatabase();
    }

    if (action === 'signup') {
      return handleSignup(data);
    }

    if (action === 'login') {
      return handleLogin(data);
    }


    /* AUTHENTICATION */

    if (!sessionToken) {
      return createJsonResponse({
        success: false,
        message: 'Authentication required. Missing sessionToken.'
      });
    }

    const session = validateSessionInternal(sessionToken);

    if (!session) {
      return createJsonResponse({
        success: false,
        message: 'Invalid or expired session. Please log in again.'
      });
    }

    const userId = cleanString(session.userId);
    const farmId = cleanString(session.farmId);


    /* ROUTING */

    switch (action) {

      case 'validateSession':
        return handleValidateSession(session);

      case 'getCurrentUser':
        return handleGetCurrentUser(userId);

      case 'logout':
        return handleLogout(sessionToken);


      /* FARM */

      case 'getFarm':
        return handleGetFarm(farmId);

      case 'createFarm':
        return handleCreateFarm(userId, data, sessionToken);

      case 'updateFarm':
        return handleUpdateFarm(farmId, data);


      /* COWS */

      case 'getCows':
        return handleGetCows(farmId);

      case 'createCow':
        return handleCreateCow(farmId, userId, data);

      case 'updateCow':
        return handleUpdateCow(farmId, userId, data);

      case 'deleteCow':
        return handleDeleteCow(farmId, userId, data.cowId);


      /* MILK */

      case 'getMilkRecords':
        return handleGetMilkRecords(farmId);

      case 'createMilkRecord':
        return handleCreateMilkRecord(farmId, userId, data);

      case 'updateMilkRecord':
        return handleUpdateMilkRecord(farmId, userId, data);

      case 'deleteMilkRecord':
        return handleDeleteMilkRecord(farmId, userId, data.recordId);


      /* EXPENSES */

      case 'getExpenses':
        return handleGetExpenses(farmId);

      case 'createExpense':
        return handleCreateExpense(farmId, userId, data);

      case 'updateExpense':
        return handleUpdateExpense(farmId, userId, data);

      case 'deleteExpense':
        return handleDeleteExpense(farmId, userId, data.expenseId);


      /* BUYERS */

      case 'getBuyers':
        return handleGetBuyers(farmId);

      case 'createBuyer':
        return handleCreateBuyer(farmId, userId, data);

      case 'updateBuyer':
        return handleUpdateBuyer(farmId, userId, data);

      case 'deleteBuyer':
        return handleDeleteBuyer(farmId, userId, data.buyerId);


      /* SALES */

      case 'getSales':
        return handleGetSales(farmId);

      case 'createSale':
        return handleCreateSale(farmId, userId, data);

      case 'updateSale':
        return handleUpdateSale(farmId, userId, data);

      case 'deleteSale':
        return handleDeleteSale(farmId, userId, data.saleId);


      /* DASHBOARD */

      case 'getDashboardData':
        return handleGetDashboardData(farmId, userId);


      /* REPORTS */

      case 'getReportData':
        return handleGetReportData(farmId, data);


      default:
        return createJsonResponse({
          success: false,
          message: 'Unknown API action: ' + action
        });
    }

  } catch (error) {

    console.error('DairyPulse API Error:', error);

    return createJsonResponse({
      success: false,
      message:
        'Server error processing request: ' +
        (
          error && error.message
            ? error.message
            : String(error)
        )
    });
  }
}


/* =====================================================
   GENERAL HELPERS
   ===================================================== */

function cleanString(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}


function normalizeId(value) {
  return cleanString(value);
}


function sameId(a, b) {
  const first = normalizeId(a);
  const second = normalizeId(b);

  return first !== '' && first === second;
}


function todayString() {
  return Utilities.formatDate(
    new Date(),
    CONFIG.TIMEZONE,
    'yyyy-MM-dd'
  );
}


/*
 * Safely converts Google Sheets dates, strings,
 * timestamps and Date objects into yyyy-MM-dd.
 */
function dateString(value) {

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '';
  }


  /* Already a Date object from Google Sheets */

  if (
    value instanceof Date &&
    !isNaN(value.getTime())
  ) {

    return Utilities.formatDate(
      value,
      CONFIG.TIMEZONE,
      'yyyy-MM-dd'
    );
  }


  const text =
    String(value).trim();


  if (!text) {
    return '';
  }


  /* Already yyyy-MM-dd */

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(text)
  ) {
    return text;
  }


  /* ISO timestamp */

  if (
    /^\d{4}-\d{2}-\d{2}T/.test(text)
  ) {

    const isoDate =
      new Date(text);

    if (
      !isNaN(isoDate.getTime())
    ) {

      return Utilities.formatDate(
        isoDate,
        CONFIG.TIMEZONE,
        'yyyy-MM-dd'
      );
    }
  }


  /* Other date strings */

  const parsed =
    new Date(text);

  if (
    !isNaN(parsed.getTime())
  ) {

    return Utilities.formatDate(
      parsed,
      CONFIG.TIMEZONE,
      'yyyy-MM-dd'
    );
  }


  return text;
}


/*
 * Safely converts timestamps.
 */
function timestampString(value) {

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '';
  }


  if (
    value instanceof Date &&
    !isNaN(value.getTime())
  ) {

    return value.toISOString();
  }


  return String(value);
}


function parseNumber(value) {

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return 0;
  }

  const number =
    Number(value);

  return isNaN(number)
    ? 0
    : number;
}


function round2(value) {
  return Number(
    parseNumber(value).toFixed(2)
  );
}


function generateId(prefix) {

  const randomPart =
    Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

  return (
    prefix +
    '-' +
    Date.now() +
    '-' +
    randomPart
  );
}


function createJsonResponse(data, statusCode) {

  return ContentService
    .createTextOutput(
      JSON.stringify(data)
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );
}


/* =====================================================
   GOOGLE SHEETS
   ===================================================== */

function getSpreadsheet() {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  if (!ss) {
    throw new Error(
      'Google Spreadsheet could not be opened.'
    );
  }

  return ss;
}


function getOrCreateSheet(sheetName) {

  const ss =
    getSpreadsheet();

  let sheet =
    ss.getSheetByName(sheetName);

  if (!sheet) {

    sheet =
      ss.insertSheet(sheetName);

    const headers =
      SCHEMAS[sheetName];

    if (headers) {

      sheet
        .getRange(
          1,
          1,
          1,
          headers.length
        )
        .setValues([headers]);

      sheet.setFrozenRows(1);
    }
  }

  return sheet;
}


function ensureAllSheets() {

  Object.keys(SCHEMAS)
    .forEach(function(sheetName) {

      const sheet =
        getOrCreateSheet(sheetName);

      const headers =
        SCHEMAS[sheetName];

      if (
        sheet.getLastRow() === 0
      ) {

        sheet
          .getRange(
            1,
            1,
            1,
            headers.length
          )
          .setValues([headers]);

        sheet.setFrozenRows(1);

        return;
      }


      const firstRow =
        sheet
          .getRange(
            1,
            1,
            1,
            headers.length
          )
          .getValues()[0];


      if (
        firstRow
          .join('')
          .trim() === ''
      ) {

        sheet
          .getRange(
            1,
            1,
            1,
            headers.length
          )
          .setValues([headers]);

        sheet.setFrozenRows(1);
      }
    });
}


/*
 * IMPORTANT FIX:
 *
 * Google Sheets returns cells formatted as dates
 * as JavaScript Date objects.
 *
 * This function converts all date fields to
 * yyyy-MM-dd before the data reaches the frontend.
 */
function getRowsAsObjects(sheetName) {

  const sheet =
    getOrCreateSheet(sheetName);

  const lastRow =
    sheet.getLastRow();

  const lastColumn =
    sheet.getLastColumn();


  if (
    lastRow <= 1 ||
    lastColumn === 0
  ) {
    return [];
  }


  const data =
    sheet
      .getRange(
        1,
        1,
        lastRow,
        lastColumn
      )
      .getValues();


  const headers =
    data[0].map(function(header) {

      return cleanString(header);

    });


  const dateFields = [

    'recordDate',

    'expenseDate',

    'saleDate',

    'dateOfBirth'

  ];


  const timestampFields = [

    'createdAt',

    'updatedAt',

    'timestamp',

    'expiresAt'

  ];


  const rows = [];


  for (
    let i = 1;
    i < data.length;
    i++
  ) {

    const row =
      data[i];


    if (
      !row ||
      row.every(function(cell) {

        return (
          cell === '' ||
          cell === null ||
          cell === undefined
        );

      })
    ) {
      continue;
    }


    const obj = {};


    for (
      let j = 0;
      j < headers.length;
      j++
    ) {

      const key =
        headers[j];


      if (!key) {
        continue;
      }


      const value =
        row[j];


      if (
        dateFields.includes(key)
      ) {

        obj[key] =
          dateString(value);

      }

      else if (
        timestampFields.includes(key)
      ) {

        obj[key] =
          timestampString(value);

      }

      else {

        obj[key] =
          value !== undefined
            ? value
            : '';

      }
    }


    obj._rowIndex =
      i + 1;


    rows.push(obj);
  }


  return rows;
}


function appendRowObject(
  sheetName,
  obj
) {

  const sheet =
    getOrCreateSheet(sheetName);

  const headers =
    SCHEMAS[sheetName];


  const row =
    headers.map(function(header) {

      const value =
        obj[header];

      return (
        value === undefined ||
        value === null
      )
        ? ''
        : value;

    });


  sheet.appendRow(row);
}


function updateRowObject(
  sheetName,
  rowIndex,
  obj
) {

  const sheet =
    getOrCreateSheet(sheetName);

  const headers =
    SCHEMAS[sheetName];


  headers.forEach(
    function(header, index) {

      if (
        obj[header] !== undefined
      ) {

        sheet
          .getRange(
            rowIndex,
            index + 1
          )
          .setValue(
            obj[header]
          );
      }
    });
}


function deleteRowByIndex(
  sheetName,
  rowIndex
) {

  const sheet =
    getOrCreateSheet(sheetName);


  if (
    rowIndex > 1 &&
    rowIndex <= sheet.getLastRow()
  ) {

    sheet.deleteRow(rowIndex);
  }
}


/* =====================================================
   ACTIVITY
   ===================================================== */

function logActivity(
  farmId,
  userId,
  action,
  description
) {

  if (!farmId) {
    return;
  }


  appendRowObject(
    'Activity',
    {

      activityId:
        generateId('ACT'),

      farmId:
        farmId,

      userId:
        userId || '',

      action:
        action,

      description:
        description,

      timestamp:
        new Date().toISOString()

    }
  );
}


/* =====================================================
   AUTHENTICATION
   ===================================================== */

function hashPassword(password) {

  const raw =
    String(password) +
    CONFIG.SALT;


  const digest =
    Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      raw,
      Utilities.Charset.UTF_8
    );


  let hash = '';


  digest.forEach(
    function(byte) {

      if (byte < 0) {
        byte += 256;
      }


      let hex =
        byte.toString(16);


      if (hex.length === 1) {
        hex = '0' + hex;
      }


      hash += hex;
    });


  return hash;
}


function validateSessionInternal(
  sessionToken
) {

  const token =
    cleanString(sessionToken);


  if (!token) {
    return null;
  }


  const sessions =
    getRowsAsObjects('Sessions');


  const session =
    sessions.find(
      function(s) {

        return (
          cleanString(
            s.sessionToken
          ) === token
        );

      });


  if (!session) {
    return null;
  }


  const expiresAt =
    new Date(
      session.expiresAt
    ).getTime();


  if (
    isNaN(expiresAt) ||
    Date.now() > expiresAt
  ) {

    return null;
  }


  return session;
}


/* =====================================================
   DATABASE INITIALIZATION
   ===================================================== */

function handleInitializeDatabase() {

  const lock =
    LockService.getScriptLock();


  lock.waitLock(10000);


  try {

    ensureAllSheets();


    return createJsonResponse({

      success:
        true,

      message:
        'DairyPulse database initialized successfully.',

      sheets:
        Object.keys(SCHEMAS)

    });


  } finally {

    lock.releaseLock();

  }
}


/* =====================================================
   SIGN UP
   ===================================================== */

function handleSignup(data) {

  const fullName =
    cleanString(data.fullName);


  const email =
    cleanString(data.email)
      .toLowerCase();


  const password =
    cleanString(data.password);


  if (
    !fullName ||
    !email ||
    !password
  ) {

    return createJsonResponse({

      success:
        false,

      message:
        'Full name, email and password are required.'

    });
  }


  const lock =
    LockService.getScriptLock();


  lock.waitLock(10000);


  try {

    const users =
      getRowsAsObjects('Users');


    const existing =
      users.find(
        function(user) {

          return (
            cleanString(user.email)
              .toLowerCase() ===
            email
          );

        });


    if (existing) {

      return createJsonResponse({

        success:
          false,

        message:
          'An account with this email already exists.'

      });
    }


    const userId =
      generateId('USR');


    const now =
      new Date().toISOString();


    const passwordHash =
      hashPassword(password);


    appendRowObject(
      'Users',
      {

        userId:
          userId,

        fullName:
          fullName,

        email:
          email,

        passwordHash:
          passwordHash,

        farmId:
          '',

        createdAt:
          now,

        updatedAt:
          now,

        status:
          'active'

      }
    );


    const sessionToken =
      generateId('SES');


    const expiresAt =
      new Date(
        Date.now() +
        CONFIG.SESSION_DURATION_MS
      ).toISOString();


    appendRowObject(
      'Sessions',
      {

        sessionToken:
          sessionToken,

        userId:
          userId,

        farmId:
          '',

        expiresAt:
          expiresAt,

        createdAt:
          now

      }
    );


    return createJsonResponse({

      success:
        true,

      sessionToken:
        sessionToken,

      data: {

        user: {

          userId:
            userId,

          fullName:
            fullName,

          email:
            email,

          farmId:
            null,

          status:
            'active'

        }

      },

      message:
        'Account created successfully.'

    });


  } finally {

    lock.releaseLock();

  }
}


/* =====================================================
   LOGIN
   ===================================================== */

function handleLogin(data) {

  const email =
    cleanString(data.email)
      .toLowerCase();


  const password =
    cleanString(data.password);


  if (
    !email ||
    !password
  ) {

    return createJsonResponse({

      success:
        false,

      message:
        'Email and password are required.'

    });
  }


  const passwordHash =
    hashPassword(password);


  const users =
    getRowsAsObjects('Users');


  const user =
    users.find(
      function(u) {

        return (

          cleanString(u.email)
            .toLowerCase() ===
          email &&

          cleanString(u.passwordHash) ===
          passwordHash

        );

      });


  if (!user) {

    return createJsonResponse({

      success:
        false,

      message:
        'Invalid email or password.'

    });
  }


  if (
    cleanString(user.status) !==
    'active'
  ) {

    return createJsonResponse({

      success:
        false,

      message:
        'Account is deactivated.'

    });
  }


  const sessionToken =
    generateId('SES');


  const now =
    new Date().toISOString();


  const expiresAt =
    new Date(
      Date.now() +
      CONFIG.SESSION_DURATION_MS
    ).toISOString();


  appendRowObject(
    'Sessions',
    {

      sessionToken:
        sessionToken,

      userId:
        cleanString(user.userId),

      farmId:
        cleanString(user.farmId),

      expiresAt:
        expiresAt,

      createdAt:
        now

    }
  );


  return createJsonResponse({

    success:
      true,

    sessionToken:
      sessionToken,

    data: {

      user: {

        userId:
          cleanString(user.userId),

        fullName:
          cleanString(user.fullName),

        email:
          cleanString(user.email),

        farmId:
          cleanString(user.farmId) ||
          null,

        status:
          cleanString(user.status)

      }

    },

    message:
      'Login successful.'

  });
}


/* =====================================================
   SESSION
   ===================================================== */

function handleValidateSession(
  session
) {

  const users =
    getRowsAsObjects('Users');


  const user =
    users.find(
      function(u) {

        return sameId(
          u.userId,
          session.userId
        );

      });


  if (!user) {

    return createJsonResponse({

      success:
        false,

      message:
        'User not found.'

    });
  }


  let farm = null;


  if (user.farmId) {

    const farms =
      getRowsAsObjects('Farms');


    farm =
      farms.find(
        function(f) {

          return sameId(
            f.farmId,
            user.farmId
          );

        }) || null;
  }


  return createJsonResponse({

    success:
      true,

    data: {

      user: {

        userId:
          cleanString(user.userId),

        fullName:
          cleanString(user.fullName),

        email:
          cleanString(user.email),

        farmId:
          cleanString(user.farmId) ||
          null,

        status:
          cleanString(user.status)

      },

      farm:
        farm

    }

  });
}


function handleGetCurrentUser(
  userId
) {

  const users =
    getRowsAsObjects('Users');


  const user =
    users.find(
      function(u) {

        return sameId(
          u.userId,
          userId
        );

      });


  if (!user) {

    return createJsonResponse({

      success:
        false,

      message:
        'User not found.'

    });
  }


  return createJsonResponse({

    success:
      true,

    data: {

      userId:
        cleanString(user.userId),

      fullName:
        cleanString(user.fullName),

      email:
        cleanString(user.email),

      farmId:
        cleanString(user.farmId) ||
        null

    }

  });
}


function handleLogout(
  sessionToken
) {

  const sessions =
    getRowsAsObjects('Sessions');


  const session =
    sessions.find(
      function(s) {

        return (
          cleanString(s.sessionToken) ===
          cleanString(sessionToken)
        );

      });


  if (
    session &&
    session._rowIndex
  ) {

    deleteRowByIndex(
      'Sessions',
      session._rowIndex
    );
  }


  return createJsonResponse({

    success:
      true,

    message:
      'Logged out successfully.'

  });
}


/* =====================================================
   FARM
   ===================================================== */

function handleGetFarm(
  farmId
) {

  if (!farmId) {

    return createJsonResponse({

      success:
        true,

      data:
        null

    });
  }


  const farms =
    getRowsAsObjects('Farms');


  const farm =
    farms.find(
      function(f) {

        return sameId(
          f.farmId,
          farmId
        );

      }) || null;


  return createJsonResponse({

    success:
      true,

    data:
      farm

  });
}


function handleCreateFarm(
  userId,
  data,
  sessionToken
) {

  const farmName =
    cleanString(data.farmName);


  const location =
    cleanString(data.location);


  if (
    !farmName ||
    !location
  ) {

    return createJsonResponse({

      success:
        false,

      message:
        'Farm name and location are required.'

    });
  }


  const lock =
    LockService.getScriptLock();


  lock.waitLock(10000);


  try {

    const farmId =
      generateId('FARM');


    const now =
      new Date().toISOString();


    const newFarm = {

      farmId:
        farmId,

      ownerId:
        userId,

      farmName:
        farmName,

      location:
        location,

      farmPhotoUrl:
        data.farmPhotoUrl || '',

      cowCount:
        0,

      mainMilkBuyer:
        cleanString(
          data.mainMilkBuyer
        ),

      createdAt:
        now,

      updatedAt:
        now

    };


    appendRowObject(
      'Farms',
      newFarm
    );


    /* UPDATE USER */

    const users =
      getRowsAsObjects('Users');


    const user =
      users.find(
        function(u) {

          return sameId(
            u.userId,
            userId
          );

        });


    if (
      user &&
      user._rowIndex
    ) {

      updateRowObject(
        'Users',
        user._rowIndex,
        {

          farmId:
            farmId,

          updatedAt:
            now

        }
      );
    }


    /* UPDATE SESSION */

    const sessions =
      getRowsAsObjects('Sessions');


    const session =
      sessions.find(
        function(s) {

          return (
            cleanString(
              s.sessionToken
            ) ===
            cleanString(
              sessionToken
            )
          );

        });


    if (
      session &&
      session._rowIndex
    ) {

      updateRowObject(
        'Sessions',
        session._rowIndex,
        {

          farmId:
            farmId

        }
      );
    }


    logActivity(
      farmId,
      userId,
      'Farm Created',
      'Created farm "' +
        farmName +
        '" in ' +
        location
    );


    return createJsonResponse({

      success:
        true,

      data:
        newFarm,

      message:
        'Farm created successfully.'

    });


  } finally {

    lock.releaseLock();

  }
}


function handleUpdateFarm(
  farmId,
  data
) {

  if (!farmId) {

    return createJsonResponse({

      success:
        false,

      message:
        'No farm associated with this account.'

    });
  }


  const farms =
    getRowsAsObjects('Farms');


  const farm =
    farms.find(
      function(f) {

        return sameId(
          f.farmId,
          farmId
        );

      });


  if (!farm) {

    return createJsonResponse({

      success:
        false,

      message:
        'Farm not found.'

    });
  }


  const updates = {

    updatedAt:
      new Date().toISOString()

  };


  if (
    data.farmName !== undefined
  ) {

    updates.farmName =
      cleanString(
        data.farmName
      );
  }


  if (
    data.location !== undefined
  ) {

    updates.location =
      cleanString(
        data.location
      );
  }


  if (
    data.mainMilkBuyer !== undefined
  ) {

    updates.mainMilkBuyer =
      cleanString(
        data.mainMilkBuyer
      );
  }


  if (
    data.farmPhotoUrl !== undefined
  ) {

    updates.farmPhotoUrl =
      data.farmPhotoUrl;
  }


  updateRowObject(
    'Farms',
    farm._rowIndex,
    updates
  );


  return createJsonResponse({

    success:
      true,

    message:
      'Farm profile updated successfully.'

  });
}


/* =====================================================
   COWS
   ===================================================== */

function handleGetCows(
  farmId
) {

  if (!farmId) {

    return createJsonResponse({

      success:
        true,

      data:
        []

    });
  }


  const cows =
    getRowsAsObjects('Cows')
      .filter(
        function(cow) {

          return sameId(
            cow.farmId,
            farmId
          );

        })
      .map(
        function(cow) {

          return {

            ...cow,

            cowId:
              cleanString(
                cow.cowId
              ),

            farmId:
              cleanString(
                cow.farmId
              ),

            dateOfBirth:
              dateString(
                cow.dateOfBirth
              )

          };

        });


  return createJsonResponse({

    success:
      true,

    data:
      cows

  });
}


function handleCreateCow(
  farmId,
  userId,
  data
) {

  if (!farmId) {

    return createJsonResponse({

      success:
        false,

      message:
        'No farm is associated with this account.'

    });
  }


  const cowNumber =
    cleanString(
      data.cowNumber
    );


  if (!cowNumber) {

    return createJsonResponse({

      success:
        false,

      message:
        'Cow number/tag is required.'

    });
  }


  const lock =
    LockService.getScriptLock();


  lock.waitLock(10000);


  try {

    const cows =
      getRowsAsObjects('Cows');


    const existing =
      cows.filter(
        function(cow) {

          return sameId(
            cow.farmId,
            farmId
          );

        });


    const duplicate =
      existing.some(
        function(cow) {

          return (
            cleanString(
              cow.cowNumber
            ).toLowerCase() ===
            cowNumber.toLowerCase()
          );

        });


    if (duplicate) {

      return createJsonResponse({

        success:
          false,

        message:
          'Cow with tag "' +
          cowNumber +
          '" already exists.'

      });
    }


    const cowId =
      generateId('COW');


    const now =
      new Date().toISOString();


    const newCow = {

      cowId:
        cowId,

      farmId:
        farmId,

      cowNumber:
        cowNumber,

      name:
        cleanString(
          data.name
        ),

      breed:
        cleanString(
          data.breed
        ) ||
        'Friesian',

      dateOfBirth:
        dateString(
          data.dateOfBirth
        ),

      status:
        cleanString(
          data.status
        ) ||
        'Lactating',

      photoUrl:
        data.photoUrl || '',

      notes:
        cleanString(
          data.notes
        ),

      createdAt:
        now,

      updatedAt:
        now

    };


    appendRowObject(
      'Cows',
      newCow
    );


    const farms =
      getRowsAsObjects('Farms');


    const farm =
      farms.find(
        function(f) {

          return sameId(
            f.farmId,
            farmId
          );

        });


    if (
      farm &&
      farm._rowIndex
    ) {

      updateRowObject(
        'Farms',
        farm._rowIndex,
        {

          cowCount:
            existing.length + 1,

          updatedAt:
            now

        }
      );
    }


    logActivity(
      farmId,
      userId,
      'Cow Added',
      'Added cow #' +
        cowNumber
    );


    return createJsonResponse({

      success:
        true,

      data:
        newCow,

      message:
        'Cow added successfully.'

    });


  } finally {

    lock.releaseLock();

  }
}


function handleUpdateCow(
  farmId,
  userId,
  data
) {

  const cowId =
    cleanString(
      data.cowId
    );


  if (!cowId) {

    return createJsonResponse({

      success:
        false,

      message:
        'cowId is required.'

    });
  }


  const cows =
    getRowsAsObjects('Cows');


  const cow =
    cows.find(
      function(c) {

        return (
          sameId(
            c.cowId,
            cowId
          ) &&
          sameId(
            c.farmId,
            farmId
          )
        );

      });


  if (!cow) {

    return createJsonResponse({

      success:
        false,

      message:
        'Cow not found.'

    });
  }


  const updates = {

    updatedAt:
      new Date().toISOString()

  };


  if (
    data.cowNumber !== undefined
  ) {

    updates.cowNumber =
      cleanString(
        data.cowNumber
      );
  }


  if (
    data.name !== undefined
  ) {

    updates.name =
      cleanString(
        data.name
      );
  }


  if (
    data.breed !== undefined
  ) {

    updates.breed =
      cleanString(
        data.breed
      );
  }


  if (
    data.dateOfBirth !== undefined
  ) {

    updates.dateOfBirth =
      dateString(
        data.dateOfBirth
      );
  }


  if (
    data.status !== undefined
  ) {

    updates.status =
      cleanString(
        data.status
      );
  }


  if (
    data.photoUrl !== undefined
  ) {

    updates.photoUrl =
      data.photoUrl;
  }


  if (
    data.notes !== undefined
  ) {

    updates.notes =
      cleanString(
        data.notes
      );
  }


  updateRowObject(
    'Cows',
    cow._rowIndex,
    updates
  );


  logActivity(
    farmId,
    userId,
    'Cow Updated',
    'Updated cow #' +
      (
        updates.cowNumber ||
        cow.cowNumber
      )
  );


  return createJsonResponse({

    success:
      true,

    message:
      'Cow updated successfully.'

  });
}


function handleDeleteCow(
  farmId,
  userId,
  cowId
) {

  cowId =
    cleanString(cowId);


  if (!cowId) {

    return createJsonResponse({

      success:
        false,

      message:
        'cowId is required.'

    });
  }


  const cows =
    getRowsAsObjects('Cows');


  const cow =
    cows.find(
      function(c) {

        return (
          sameId(
            c.cowId,
            cowId
          ) &&
          sameId(
            c.farmId,
            farmId
          )
        );

      });


  if (!cow) {

    return createJsonResponse({

      success:
        false,

      message:
        'Cow not found.'

    });
  }


  deleteRowByIndex(
    'Cows',
    cow._rowIndex
  );


  const remaining =
    cows.filter(
      function(c) {

        return (
          sameId(
            c.farmId,
            farmId
          ) &&
          !sameId(
            c.cowId,
            cowId
          )
        );

      }).length;


  const farms =
    getRowsAsObjects('Farms');


  const farm =
    farms.find(
      function(f) {

        return sameId(
          f.farmId,
          farmId
        );

      });


  if (
    farm &&
    farm._rowIndex
  ) {

    updateRowObject(
      'Farms',
      farm._rowIndex,
      {

        cowCount:
          remaining,

        updatedAt:
          new Date().toISOString()

      }
    );
  }


  logActivity(
    farmId,
    userId,
    'Cow Removed',
    'Removed cow #' +
      cow.cowNumber
  );


  return createJsonResponse({

    success:
      true,

    message:
      'Cow deleted successfully.'

  });
}


/* =====================================================
   MILK
   ===================================================== */

function handleGetMilkRecords(
  farmId
) {

  if (!farmId) {

    return createJsonResponse({

      success:
        true,

      data:
        []

    });
  }


  const records =
    getRowsAsObjects('MilkRecords')
      .filter(
        function(record) {

          return sameId(
            record.farmId,
            farmId
          );

        })
      .map(
        function(record) {

          const morning =
            parseNumber(
              record.morningLitres
            );


          const evening =
            parseNumber(
              record.eveningLitres
            );


          return {

            ...record,

            recordId:
              cleanString(
                record.recordId
              ),

            farmId:
              cleanString(
                record.farmId
              ),

            recordDate:
              dateString(
                record.recordDate
              ),

            morningLitres:
              morning,

            eveningLitres:
              evening,

            totalLitres:
              round2(
                record.totalLitres !== '' &&
                record.totalLitres !== null &&
                record.totalLitres !== undefined
                  ? parseNumber(
                      record.totalLitres
                    )
                  : morning + evening
              )

          };

        })
      .sort(
        function(a, b) {

          return String(
            b.recordDate || ''
          ).localeCompare(
            String(
              a.recordDate || ''
            )
          );

        });


  return createJsonResponse({

    success:
      true,

    data:
      records,

    count:
      records.length

  });
}


function handleCreateMilkRecord(
  farmId,
  userId,
  data
) {

  if (!farmId) {

    return createJsonResponse({

      success:
        false,

      message:
        'No farm is associated with this account.'

    });
  }


  const recordDate =
    dateString(
      data.recordDate
    );


  if (!recordDate) {

    return createJsonResponse({

      success:
        false,

      message:
        'recordDate is required.'

    });
  }


  const morning =
    Math.max(
      0,
      parseNumber(
        data.morningLitres
      )
    );


  const evening =
    Math.max(
      0,
      parseNumber(
        data.eveningLitres
      )
    );


  const total =
    round2(
      morning +
      evening
    );


  const recordId =
    generateId('MILK');


  const now =
    new Date().toISOString();


  const newRecord = {

    recordId:
      recordId,

    farmId:
      farmId,

    recordDate:
      recordDate,

    morningLitres:
      morning,

    eveningLitres:
      evening,

    totalLitres:
      total,

    notes:
      cleanString(
        data.notes
      ),

    createdBy:
      userId,

    createdAt:
      now,

    updatedAt:
      now

  };


  appendRowObject(
    'MilkRecords',
    newRecord
  );


  logActivity(
    farmId,
    userId,
    'Milk Recorded',
    'Recorded ' +
      total +
      ' L on ' +
      recordDate
  );


  return createJsonResponse({

    success:
      true,

    data:
      newRecord,

    message:
      'Milk record saved.'

  });
}


function handleUpdateMilkRecord(
  farmId,
  userId,
  data
) {

  const recordId =
    cleanString(
      data.recordId
    );


  if (!recordId) {

    return createJsonResponse({

      success:
        false,

      message:
        'recordId is required.'

    });
  }


  const records =
    getRowsAsObjects('MilkRecords');


  const record =
    records.find(
      function(r) {

        return (
          sameId(
            r.recordId,
            recordId
          ) &&
          sameId(
            r.farmId,
            farmId
          )
        );

      });


  if (!record) {

    return createJsonResponse({

      success:
        false,

      message:
        'Milk record not found.'

    });
  }


  const morning =
    data.morningLitres !== undefined
      ? Math.max(
          0,
          parseNumber(
            data.morningLitres
          )
        )
      : parseNumber(
          record.morningLitres
        );


  const evening =
    data.eveningLitres !== undefined
      ? Math.max(
          0,
          parseNumber(
            data.eveningLitres
          )
        )
      : parseNumber(
          record.eveningLitres
        );


  const updates = {

    morningLitres:
      morning,

    eveningLitres:
      evening,

    totalLitres:
      round2(
        morning +
        evening
      ),

    updatedAt:
      new Date().toISOString()

  };


  if (
    data.recordDate !== undefined
  ) {

    updates.recordDate =
      dateString(
        data.recordDate
      );
  }


  if (
    data.notes !== undefined
  ) {

    updates.notes =
      cleanString(
        data.notes
      );
  }


  updateRowObject(
    'MilkRecords',
    record._rowIndex,
    updates
  );


  logActivity(
    farmId,
    userId,
    'Milk Record Updated',
    'Updated milk record.'
  );


  return createJsonResponse({

    success:
      true,

    message:
      'Milk record updated.'

  });
}


function handleDeleteMilkRecord(
  farmId,
  userId,
  recordId
) {

  recordId =
    cleanString(
      recordId
    );


  if (!recordId) {

    return createJsonResponse({

      success:
        false,

      message:
        'recordId is required.'

    });
  }


  const records =
    getRowsAsObjects(
      'MilkRecords'
    );


  const record =
    records.find(
      function(r) {

        return (
          sameId(
            r.recordId,
            recordId
          ) &&
          sameId(
            r.farmId,
            farmId
          )
        );

      });


  if (!record) {

    return createJsonResponse({

      success:
        false,

      message:
        'Milk record not found.'

    });
  }


  deleteRowByIndex(
    'MilkRecords',
    record._rowIndex
  );


  logActivity(
    farmId,
    userId,
    'Milk Record Deleted',
    'Deleted milk record for ' +
      dateString(
        record.recordDate
      )
  );


  return createJsonResponse({

    success:
      true,

    message:
      'Milk record deleted.'

  });
}


/* =====================================================
   EXPENSES
   ===================================================== */

function handleGetExpenses(
  farmId
) {

  if (!farmId) {

    return createJsonResponse({

      success:
        true,

      data:
        []

    });
  }


  const expenses =
    getRowsAsObjects('Expenses')
      .filter(
        function(expense) {

          return sameId(
            expense.farmId,
            farmId
          );

        })
      .map(
        function(expense) {

          return {

            ...expense,

            expenseId:
              cleanString(
                expense.expenseId
              ),

            farmId:
              cleanString(
                expense.farmId
              ),

            expenseDate:
              dateString(
                expense.expenseDate
              ),

            amount:
              parseNumber(
                expense.amount
              )

          };

        })
      .sort(
        function(a, b) {

          return String(
            b.expenseDate || ''
          ).localeCompare(
            String(
              a.expenseDate || ''
            )
          );

        });


  return createJsonResponse({

    success:
      true,

    data:
      expenses,

    count:
      expenses.length

  });
}


function handleCreateExpense(
  farmId,
  userId,
  data
) {

  if (!farmId) {

    return createJsonResponse({

      success:
        false,

      message:
        'No farm is associated with this account.'

    });
  }


  const expenseDate =
    dateString(
      data.expenseDate
    );


  const category =
    cleanString(
      data.category
    );


  const amount =
    parseNumber(
      data.amount
    );


  if (
    !expenseDate ||
    !category ||
    amount <= 0
  ) {

    return createJsonResponse({

      success:
        false,

      message:
        'Date, category and a valid amount greater than zero are required.'

    });
  }


  const expenseId =
    generateId('EXP');


  const now =
    new Date().toISOString();


  const newExpense = {

    expenseId:
      expenseId,

    farmId:
      farmId,

    expenseDate:
      expenseDate,

    category:
      category,

    description:
      cleanString(
        data.description
      ),

    amount:
      round2(amount),

    notes:
      cleanString(
        data.notes
      ),

    createdBy:
      userId,

    createdAt:
      now,

    updatedAt:
      now

  };


  appendRowObject(
    'Expenses',
    newExpense
  );


  logActivity(
    farmId,
    userId,
    'Expense Added',
    'Recorded UGX ' +
      round2(amount).toLocaleString() +
      ' for ' +
      category
  );


  return createJsonResponse({

    success:
      true,

    data:
      newExpense,

    message:
      'Expense added successfully.'

  });
}


function handleUpdateExpense(
  farmId,
  userId,
  data
) {

  const expenseId =
    cleanString(
      data.expenseId
    );


  if (!expenseId) {

    return createJsonResponse({

      success:
        false,

      message:
        'expenseId is required.'

    });
  }


  const expenses =
    getRowsAsObjects(
      'Expenses'
    );


  const expense =
    expenses.find(
      function(e) {

        return (
          sameId(
            e.expenseId,
            expenseId
          ) &&
          sameId(
            e.farmId,
            farmId
          )
        );

      });


  if (!expense) {

    return createJsonResponse({

      success:
        false,

      message:
        'Expense not found.'

    });
  }


  const updates = {

    updatedAt:
      new Date().toISOString()

  };


  if (
    data.expenseDate !== undefined
  ) {

    updates.expenseDate =
      dateString(
        data.expenseDate
      );
  }


  if (
    data.category !== undefined
  ) {

    updates.category =
      cleanString(
        data.category
      );
  }


  if (
    data.description !== undefined
  ) {

    updates.description =
      cleanString(
        data.description
      );
  }


  if (
    data.amount !== undefined
  ) {

    updates.amount =
      round2(
        parseNumber(
          data.amount
        )
      );
  }


  if (
    data.notes !== undefined
  ) {

    updates.notes =
      cleanString(
        data.notes
      );
  }


  updateRowObject(
    'Expenses',
    expense._rowIndex,
    updates
  );


  logActivity(
    farmId,
    userId,
    'Expense Updated',
    'Updated expense.'
  );


  return createJsonResponse({

    success:
      true,

    message:
      'Expense updated.'

  });
}


function handleDeleteExpense(
  farmId,
  userId,
  expenseId
) {

  expenseId =
    cleanString(
      expenseId
    );


  const expenses =
    getRowsAsObjects(
      'Expenses'
    );


  const expense =
    expenses.find(
      function(e) {

        return (
          sameId(
            e.expenseId,
            expenseId
          ) &&
          sameId(
            e.farmId,
            farmId
          )
        );

      });


  if (!expense) {

    return createJsonResponse({

      success:
        false,

      message:
        'Expense not found.'

    });
  }


  deleteRowByIndex(
    'Expenses',
    expense._rowIndex
  );


  logActivity(
    farmId,
    userId,
    'Expense Deleted',
    'Deleted expense: ' +
      expense.category
  );


  return createJsonResponse({

    success:
      true,

    message:
      'Expense deleted.'

  });
}


/* =====================================================
   BUYERS
   ===================================================== */

function handleGetBuyers(
  farmId
) {

  if (!farmId) {

    return createJsonResponse({

      success:
        true,

      data:
        []

    });
  }


  const buyers =
    getRowsAsObjects('Buyers')
      .filter(
        function(buyer) {

          return sameId(
            buyer.farmId,
            farmId
          );

        })
      .map(
        function(buyer) {

          return {

            ...buyer,

            buyerId:
              cleanString(
                buyer.buyerId
              ),

            farmId:
              cleanString(
                buyer.farmId
              ),

            name:
              cleanString(
                buyer.name
              ),

            phone:
              cleanString(
                buyer.phone
              ),

            location:
              cleanString(
                buyer.location
              )

          };

        });


  return createJsonResponse({

    success:
      true,

    data:
      buyers

  });
}


function handleCreateBuyer(
  farmId,
  userId,
  data
) {

  const name =
    cleanString(
      data.name
    );


  if (
    !farmId ||
    !name
  ) {

    return createJsonResponse({

      success:
        false,

      message:
        'Farm and buyer name are required.'

    });
  }


  const buyerId =
    generateId('BUY');


  const now =
    new Date().toISOString();


  const newBuyer = {

    buyerId:
      buyerId,

    farmId:
      farmId,

    name:
      name,

    phone:
      cleanString(
        data.phone
      ),

    location:
      cleanString(
        data.location
      ),

    createdAt:
      now,

    updatedAt:
      now

  };


  appendRowObject(
    'Buyers',
    newBuyer
  );


  logActivity(
    farmId,
    userId,
    'Buyer Added',
    'Added buyer "' +
      name +
      '"'
  );


  return createJsonResponse({

    success:
      true,

    data:
      newBuyer,

    message:
      'Buyer added successfully.'

  });
}


function handleUpdateBuyer(
  farmId,
  userId,
  data
) {

  const buyerId =
    cleanString(
      data.buyerId
    );


  const buyers =
    getRowsAsObjects(
      'Buyers'
    );


  const buyer =
    buyers.find(
      function(b) {

        return (
          sameId(
            b.buyerId,
            buyerId
          ) &&
          sameId(
            b.farmId,
            farmId
          )
        );

      });


  if (!buyer) {

    return createJsonResponse({

      success:
        false,

      message:
        'Buyer not found.'

    });
  }


  const updates = {

    updatedAt:
      new Date().toISOString()

  };


  if (
    data.name !== undefined
  ) {

    updates.name =
      cleanString(
        data.name
      );
  }


  if (
    data.phone !== undefined
  ) {

    updates.phone =
      cleanString(
        data.phone
      );
  }


  if (
    data.location !== undefined
  ) {

    updates.location =
      cleanString(
        data.location
      );
  }


  updateRowObject(
    'Buyers',
    buyer._rowIndex,
    updates
  );


  logActivity(
    farmId,
    userId,
    'Buyer Updated',
    'Updated buyer.'
  );


  return createJsonResponse({

    success:
      true,

    message:
      'Buyer updated.'

  });
}


function handleDeleteBuyer(
  farmId,
  userId,
  buyerId
) {

  buyerId =
    cleanString(
      buyerId
    );


  const buyers =
    getRowsAsObjects(
      'Buyers'
    );


  const buyer =
    buyers.find(
      function(b) {

        return (
          sameId(
            b.buyerId,
            buyerId
          ) &&
          sameId(
            b.farmId,
            farmId
          )
        );

      });


  if (!buyer) {

    return createJsonResponse({

      success:
        false,

      message:
        'Buyer not found.'

    });
  }


  deleteRowByIndex(
    'Buyers',
    buyer._rowIndex
  );


  logActivity(
    farmId,
    userId,
    'Buyer Deleted',
    'Deleted buyer ' +
      buyer.name
  );


  return createJsonResponse({

    success:
      true,

    message:
      'Buyer deleted.'

  });
}


/* =====================================================
   SALES
   ===================================================== */

function handleGetSales(
  farmId
) {

  if (!farmId) {

    return createJsonResponse({

      success:
        true,

      data:
        []

    });
  }


  const buyers =
    getRowsAsObjects('Buyers')
      .filter(
        function(buyer) {

          return sameId(
            buyer.farmId,
            farmId
          );

        });


  const buyersMap = {};


  buyers.forEach(
    function(buyer) {

      buyersMap[
        cleanString(
          buyer.buyerId
        )
      ] =
        cleanString(
          buyer.name
        );

    });


  const sales =
    getRowsAsObjects('Sales')
      .filter(
        function(sale) {

          return sameId(
            sale.farmId,
            farmId
          );

        })
      .map(
        function(sale) {

          return {

            ...sale,

            saleId:
              cleanString(
                sale.saleId
              ),

            farmId:
              cleanString(
                sale.farmId
              ),

            buyerId:
              cleanString(
                sale.buyerId
              ),

            buyerName:
              buyersMap[
                cleanString(
                  sale.buyerId
                )
              ] ||
              'Direct / Cash Buyer',

            saleDate:
              dateString(
                sale.saleDate
              ),

            litres:
              parseNumber(
                sale.litres
              ),

            pricePerLitre:
              parseNumber(
                sale.pricePerLitre
              ),

            totalAmount:
              parseNumber(
                sale.totalAmount
              ),

            amountPaid:
              parseNumber(
                sale.amountPaid
              ),

            amountDue:
              parseNumber(
                sale.amountDue
              )

          };

        })
      .sort(
        function(a, b) {

          return String(
            b.saleDate || ''
          ).localeCompare(
            String(
              a.saleDate || ''
            )
          );

        });


  return createJsonResponse({

    success:
      true,

    data:
      sales,

    count:
      sales.length

  });
}


function handleCreateSale(
  farmId,
  userId,
  data
) {

  if (!farmId) {

    return createJsonResponse({

      success:
        false,

      message:
        'No farm is associated with this account.'

    });
  }


  const saleDate =
    dateString(
      data.saleDate
    );


  const litres =
    parseNumber(
      data.litres
    );


  const price =
    parseNumber(
      data.pricePerLitre
    );


  if (
    !saleDate ||
    litres <= 0 ||
    price <= 0
  ) {

    return createJsonResponse({

      success:
        false,

      message:
        'Date, litres and price per litre must be valid values greater than zero.'

    });
  }


  const total =
    round2(
      litres *
      price
    );


  const paid =
    data.amountPaid !== undefined
      ? Math.max(
          0,
          parseNumber(
            data.amountPaid
          )
        )
      : total;


  const due =
    round2(
      Math.max(
        0,
        total -
        paid
      )
    );


  const saleId =
    generateId('SALE');


  const now =
    new Date().toISOString();


  const newSale = {

    saleId:
      saleId,

    farmId:
      farmId,

    buyerId:
      cleanString(
        data.buyerId
      ),

    saleDate:
      saleDate,

    litres:
      litres,

    pricePerLitre:
      price,

    totalAmount:
      total,

    amountPaid:
      paid,

    amountDue:
      due,

    notes:
      cleanString(
        data.notes
      ),

    createdBy:
      userId,

    createdAt:
      now,

    updatedAt:
      now

  };


  appendRowObject(
    'Sales',
    newSale
  );


  logActivity(
    farmId,
    userId,
    'Sale Recorded',
    'Sold ' +
      litres +
      ' L for UGX ' +
      total.toLocaleString()
  );


  return createJsonResponse({

    success:
      true,

    data:
      newSale,

    message:
      'Sale recorded successfully.'

  });
}


function handleUpdateSale(
  farmId,
  userId,
  data
) {

  const saleId =
    cleanString(
      data.saleId
    );


  const sales =
    getRowsAsObjects(
      'Sales'
    );


  const sale =
    sales.find(
      function(s) {

        return (
          sameId(
            s.saleId,
            saleId
          ) &&
          sameId(
            s.farmId,
            farmId
          )
        );

      });


  if (!sale) {

    return createJsonResponse({

      success:
        false,

      message:
        'Sale not found.'

    });
  }


  const litres =
    data.litres !== undefined
      ? parseNumber(
          data.litres
        )
      : parseNumber(
          sale.litres
        );


  const price =
    data.pricePerLitre !== undefined
      ? parseNumber(
          data.pricePerLitre
        )
      : parseNumber(
          sale.pricePerLitre
        );


  if (
    litres <= 0 ||
    price <= 0
  ) {

    return createJsonResponse({

      success:
        false,

      message:
        'Litres and price per litre must be greater than zero.'

    });
  }


  const total =
    round2(
      litres *
      price
    );


  const paid =
    data.amountPaid !== undefined
      ? Math.max(
          0,
          parseNumber(
            data.amountPaid
          )
        )
      : parseNumber(
          sale.amountPaid
        );


  const due =
    round2(
      Math.max(
        0,
        total -
        paid
      )
    );


  const updates = {

    litres:
      litres,

    pricePerLitre:
      price,

    totalAmount:
      total,

    amountPaid:
      paid,

    amountDue:
      due,

    updatedAt:
      new Date().toISOString()

  };


  if (
    data.buyerId !== undefined
  ) {

    updates.buyerId =
      cleanString(
        data.buyerId
      );
  }


  if (
    data.saleDate !== undefined
  ) {

    updates.saleDate =
      dateString(
        data.saleDate
      );
  }


  if (
    data.notes !== undefined
  ) {

    updates.notes =
      cleanString(
        data.notes
      );
  }


  updateRowObject(
    'Sales',
    sale._rowIndex,
    updates
  );


  logActivity(
    farmId,
    userId,
    'Sale Updated',
    'Updated sale.'
  );


  return createJsonResponse({

    success:
      true,

    message:
      'Sale updated.'

  });
}


function handleDeleteSale(
  farmId,
  userId,
  saleId
) {

  saleId =
    cleanString(
      saleId
    );


  const sales =
    getRowsAsObjects(
      'Sales'
    );


  const sale =
    sales.find(
      function(s) {

        return (
          sameId(
            s.saleId,
            saleId
          ) &&
          sameId(
            s.farmId,
            farmId
          )
        );

      });


  if (!sale) {

    return createJsonResponse({

      success:
        false,

      message:
        'Sale not found.'

    });
  }


  deleteRowByIndex(
    'Sales',
    sale._rowIndex
  );


  logActivity(
    farmId,
    userId,
    'Sale Deleted',
    'Deleted sale.'
  );


  return createJsonResponse({

    success:
      true,

    message:
      'Sale deleted.'

  });
}


/* =====================================================
   DATE MATH HELPERS
   ===================================================== */

/*
 * Converts yyyy-MM-dd into a local date object
 * without the UTC shift problem.
 */
function localDateFromString(
  dateValue
) {

  const value =
    dateString(
      dateValue
    );


  if (!value) {
    return null;
  }


  const parts =
    value
      .split('-')
      .map(Number);


  if (
    parts.length !== 3 ||
    parts.some(isNaN)
  ) {
    return null;
  }


  return new Date(
    parts[0],
    parts[1] - 1,
    parts[2],
    12,
    0,
    0
  );
}


function daysBetweenDates(
  dateA,
  dateB
) {

  const a =
    localDateFromString(
      dateA
    );

  const b =
    localDateFromString(
      dateB
    );


  if (!a || !b) {
    return null;
  }


  return Math.floor(
    (
      b.getTime() -
      a.getTime()
    ) /
    (
      24 *
      60 *
      60 *
      1000
    )
  );
}


/*
 * Returns how many days ago a record date was
 * relative to today in Africa/Kampala.
 */
function daysAgoFromToday(
  recordDate
) {

  const record =
    localDateFromString(
      recordDate
    );


  if (!record) {
    return null;
  }


  const today =
    localDateFromString(
      todayString()
    );


  if (!today) {
    return null;
  }


  return Math.floor(
    (
      today.getTime() -
      record.getTime()
    ) /
    (
      24 *
      60 *
      60 *
      1000
    )
  );
}


/* =====================================================
   DASHBOARD
   ===================================================== */

function handleGetDashboardData(
  farmId,
  userId
) {

  if (!farmId) {

    return createDashboardResponse(
      null,
      [],
      [],
      [],
      [],
      [],
      userId
    );
  }


  const farms =
    getRowsAsObjects(
      'Farms'
    );


  const farm =
    farms.find(
      function(f) {

        return sameId(
          f.farmId,
          farmId
        );

      }) || null;


  const cows =
    getRowsAsObjects('Cows')
      .filter(
        function(c) {

          return sameId(
            c.farmId,
            farmId
          );

        });


  const milkRecords =
    getRowsAsObjects(
      'MilkRecords'
    )
      .filter(
        function(m) {

          return sameId(
            m.farmId,
            farmId
          );

        });


  const expenses =
    getRowsAsObjects(
      'Expenses'
    )
      .filter(
        function(e) {

          return sameId(
            e.farmId,
            farmId
          );

        });


  const sales =
    getRowsAsObjects(
      'Sales'
    )
      .filter(
        function(s) {

          return sameId(
            s.farmId,
            farmId
          );

        });


  const activities =
    getRowsAsObjects(
      'Activity'
    )
      .filter(
        function(a) {

          return sameId(
            a.farmId,
            farmId
          );

        })
      .sort(
        function(a, b) {

          return String(
            b.timestamp || ''
          ).localeCompare(
            String(
              a.timestamp || ''
            )
          );

        })
      .slice(0, 10);


  const today =
    todayString();


  /* ===================================================
     TODAY
     =================================================== */

  const todayMilk =
    milkRecords
      .filter(
        function(r) {

          return (
            dateString(
              r.recordDate
            ) === today
          );

        })
      .reduce(
        function(total, r) {

          return (
            total +
            parseNumber(
              r.totalLitres
            )
          );

        },
        0
      );


  const todayRevenue =
    sales
      .filter(
        function(s) {

          return (
            dateString(
              s.saleDate
            ) === today
          );

        })
      .reduce(
        function(total, s) {

          return (
            total +
            parseNumber(
              s.totalAmount
            )
          );

        },
        0
      );


  const todayExpenses =
    expenses
      .filter(
        function(e) {

          return (
            dateString(
              e.expenseDate
            ) === today
          );

        })
      .reduce(
        function(total, e) {

          return (
            total +
            parseNumber(
              e.amount
            )
          );

        },
        0
      );


  const estimatedMargin =
    round2(
      todayRevenue -
      todayExpenses
    );


  /* ===================================================
     ALL-TIME
     =================================================== */

  const totalMilk =
    milkRecords.reduce(
      function(total, r) {

        return (
          total +
          parseNumber(
            r.totalLitres
          )
        );

      },
      0
    );


  const totalRevenue =
    sales.reduce(
      function(total, s) {

        return (
          total +
          parseNumber(
            s.totalAmount
          )
        );

      },
      0
    );


  const totalExpenses =
    expenses.reduce(
      function(total, e) {

        return (
          total +
          parseNumber(
            e.amount
          )
        );

      },
      0
    );


  const outstandingPayments =
    sales.reduce(
      function(total, s) {

        return (
          total +
          Math.max(
            0,
            parseNumber(
              s.amountDue
            )
          )
        );

      },
      0
    );


  /* ===================================================
     CURRENT MONTH
     =================================================== */

  const currentMonth =
    today.substring(
      0,
      7
    );


  const monthMilk =
    milkRecords
      .filter(
        function(record) {

          return dateString(
            record.recordDate
          ).indexOf(
            currentMonth
          ) === 0;

        })
      .reduce(
        function(total, record) {

          return (
            total +
            parseNumber(
              record.totalLitres
            )
          );

        },
        0
      );


  const monthRevenue =
    sales
      .filter(
        function(sale) {

          return dateString(
            sale.saleDate
          ).indexOf(
            currentMonth
          ) === 0;

        })
      .reduce(
        function(total, sale) {

          return (
            total +
            parseNumber(
              sale.totalAmount
            )
          );

        },
        0
      );


  const monthExpenses =
    expenses
      .filter(
        function(expense) {

          return dateString(
            expense.expenseDate
          ).indexOf(
            currentMonth
          ) === 0;

        })
      .reduce(
        function(total, expense) {

          return (
            total +
            parseNumber(
              expense.amount
            )
          );

        },
        0
      );


  const monthNetMargin =
    round2(
      monthRevenue -
      monthExpenses
    );


  /* ===================================================
     HERD
     =================================================== */

  const cowCount =
    cows.length;


  const lactatingCows =
    cows.filter(
      function(cow) {

        return (
          cleanString(
            cow.status
          ).toLowerCase() ===
          'lactating'
        );

      }).length;


  /* ===================================================
     LAST 7 DAYS
     =================================================== */

  const dailyMilkTrend = [];

  let currentWeekMilk = 0;


  for (
    let i = 6;
    i >= 0;
    i--
  ) {

    const baseDate =
      localDateFromString(
        today
      );


    baseDate.setDate(
      baseDate.getDate() -
      i
    );


    const dStr =
      Utilities.formatDate(
        baseDate,
        CONFIG.TIMEZONE,
        'yyyy-MM-dd'
      );


    const dayName =
      Utilities.formatDate(
        baseDate,
        CONFIG.TIMEZONE,
        'EEE'
      );


    const dayRecords =
      milkRecords.filter(
        function(r) {

          return (
            dateString(
              r.recordDate
            ) === dStr
          );

        });


    const morning =
      dayRecords.reduce(
        function(total, r) {

          return (
            total +
            parseNumber(
              r.morningLitres
            )
          );

        },
        0
      );


    const evening =
      dayRecords.reduce(
        function(total, r) {

          return (
            total +
            parseNumber(
              r.eveningLitres
            )
          );

        },
        0
      );


    const total =
      round2(
        morning +
        evening
      );


    currentWeekMilk +=
      total;


    dailyMilkTrend.push({

      date:
        dStr,

      label:
        dayName,

      morningLitres:
        round2(morning),

      eveningLitres:
        round2(evening),

      totalLitres:
        total

    });
  }


  /* ===================================================
     PREVIOUS 7 DAYS
     =================================================== */

  let previousWeekMilk = 0;


  for (
    let i = 7;
    i <= 13;
    i++
  ) {

    const baseDate =
      localDateFromString(
        today
      );


    baseDate.setDate(
      baseDate.getDate() -
      i
    );


    const dStr =
      Utilities.formatDate(
        baseDate,
        CONFIG.TIMEZONE,
        'yyyy-MM-dd'
      );


    milkRecords.forEach(
      function(record) {

        if (
          dateString(
            record.recordDate
          ) === dStr
        ) {

          previousWeekMilk +=
            parseNumber(
              record.totalLitres
            );
        }

      });
  }


  currentWeekMilk =
    round2(
      currentWeekMilk
    );


  previousWeekMilk =
    round2(
      previousWeekMilk
    );


  let productionChangePct =
    null;


  if (
    previousWeekMilk > 0
  ) {

    productionChangePct =
      Number(
        (
          (
            (
              currentWeekMilk -
              previousWeekMilk
            ) /
            previousWeekMilk
          ) *
          100
        ).toFixed(1)
      );
  }


  /* ===================================================
     EXPENSE BREAKDOWN
     =================================================== */

  const expenseMap = {};


  expenses.forEach(
    function(e) {

      const category =
        cleanString(
          e.category
        ) ||
        'Other';


      expenseMap[category] =
        (
          expenseMap[category] ||
          0
        ) +
        parseNumber(
          e.amount
        );

    });


  const expenseBreakdown =
    Object.keys(
      expenseMap
    )
      .map(
        function(category) {

          return {

            category:
              category,

            amount:
              round2(
                expenseMap[category]
              ),

            percentage:
              totalExpenses > 0
                ? Number(
                    (
                      (
                        expenseMap[category] /
                        totalExpenses
                      ) *
                      100
                    ).toFixed(1)
                  )
                : 0

          };

        })
      .sort(
        function(a, b) {

          return (
            b.amount -
            a.amount
          );

        });


  /* ===================================================
     FARM PULSE
     =================================================== */

  let pulseStatus =
    'getting_started';


  let pulseTitle =
    'Getting Started';


  let pulseMessage =
    'Start recording your farm data to generate useful insights.';


  let pulseHint =
    '+ Record Milk';


  const milkDays =
    new Set(
      milkRecords
        .map(
          function(r) {

            return dateString(
              r.recordDate
            );

          })
        .filter(
          function(date) {

            return date !== '';

          })
    ).size;


  if (
    milkDays < 2
  ) {

    pulseStatus =
      'getting_started';

    pulseTitle =
      'Getting Started';

    pulseMessage =
      'Record milk for at least 2 days to generate production trends.';

    pulseHint =
      '+ Record Milk';

  }

  else if (
    productionChangePct !== null &&
    productionChangePct <= -12
  ) {

    pulseStatus =
      'attention';

    pulseTitle =
      'Production Needs Attention';

    pulseMessage =
      'Milk production is down ' +
      Math.abs(
        productionChangePct
      ) +
      '% compared with the previous 7 days.';

    pulseHint =
      'Review herd and feed records';

  }

  else if (
    productionChangePct !== null &&
    productionChangePct < -4
  ) {

    pulseStatus =
      'watch';

    pulseTitle =
      'Production Declining';

    pulseMessage =
      'Milk production is down ' +
      Math.abs(
        productionChangePct
      ) +
      '% compared with the previous 7 days.';

    pulseHint =
      'Monitor daily milk trends';

  }

  else if (
    outstandingPayments > 0 &&
    outstandingPayments >
      totalRevenue * 0.4
  ) {

    pulseStatus =
      'watch';

    pulseTitle =
      'Outstanding Payments';

    pulseMessage =
      'There are UGX ' +
      outstandingPayments.toLocaleString() +
      ' in unpaid sales.';

    pulseHint =
      'Follow up on pending sales';

  }

  else {

    pulseStatus =
      'steady';

    pulseTitle =
      'Farm Is Steady';

    pulseMessage =
      'Your farm records are being maintained consistently.';

    pulseHint =
      'Keep recording daily';

  }


  /* ===================================================
     ALERTS
     =================================================== */

  const alerts = [];


  if (
    milkDays > 0 &&
    todayMilk === 0
  ) {

    alerts.push({

      id:
        'no-milk-today',

      type:
        'info',

      title:
        'No milk recorded today',

      message:
        'Milk production has not been recorded for today.',

      linkTo:
        '/milk',

      linkText:
        'Record today’s milk →'

    });
  }


  if (
    productionChangePct !== null &&
    productionChangePct < -5
  ) {

    alerts.push({

      id:
        'production-drop',

      type:
        'warning',

      title:
        'Milk production is declining',

      message:
        'Production is ' +
        Math.abs(
          productionChangePct
        ) +
        '% lower than the previous week.',

      linkTo:
        '/milk',

      linkText:
        'Review production →'

    });
  }


  if (
    outstandingPayments > 0
  ) {

    alerts.push({

      id:
        'outstanding-payments',

      type:
        'info',

      title:
        'Pending buyer collections',

      message:
        'UGX ' +
        outstandingPayments.toLocaleString() +
        ' remains unpaid.',

      linkTo:
        '/sales',

      linkText:
        'View sales →'

    });
  }


  /* ===================================================
     FINANCIAL COMPARISON
     =================================================== */

  const financesComparison = [

    {

      period:
        'Total Farm Records',

      revenue:
        round2(
          totalRevenue
        ),

      expenses:
        round2(
          totalExpenses
        ),

      margin:
        round2(
          totalRevenue -
          totalExpenses
        )

    },

    {

      period:
        'Current Month',

      revenue:
        round2(
          monthRevenue
        ),

      expenses:
        round2(
          monthExpenses
        ),

      margin:
        round2(
          monthNetMargin
        )

    }

  ];


  /* ===================================================
     FRONTEND KPI OBJECT
     =================================================== */

  const kpis = {

    todayMilkLitres:
      round2(
        todayMilk
      ),

    todayRevenue:
      round2(
        todayRevenue
      ),

    todayExpenses:
      round2(
        todayExpenses
      ),

    monthNetMargin:
      round2(
        monthNetMargin
      ),

    herdSize:
      cowCount,

    lactatingCows:
      lactatingCows,

    outstandingReceivables:
      round2(
        outstandingPayments
      ),

    monthMilkLitres:
      round2(
        monthMilk
      )

  };


  /* ===================================================
     RESPONSE
     =================================================== */

  const data = {

    kpis:
      kpis,


    farm:
      farm,


    todayMilk:
      round2(
        todayMilk
      ),

    todayRevenue:
      round2(
        todayRevenue
      ),

    todayExpenses:
      round2(
        todayExpenses
      ),

    estimatedMargin:
      round2(
        estimatedMargin
      ),

    cowCount:
      cowCount,

    weeklyMilk:
      currentWeekMilk,

    previousWeeklyMilk:
      previousWeekMilk,

    productionChangePct:
      productionChangePct,

    outstandingPayments:
      round2(
        outstandingPayments
      ),


    farmPulse: {

      status:
        pulseStatus,

      title:
        pulseTitle,

      headline:
        pulseTitle,

      message:
        pulseMessage,

      summary:
        pulseMessage,

      actionHint:
        pulseHint

    },


    alerts:
      alerts,


    recentActivity:
      activities,


    dailyMilkTrend:
      dailyMilkTrend,

    milkTrend:
      dailyMilkTrend,


    expenseBreakdown:
      expenseBreakdown,


    financesComparison:
      financesComparison,

    financialComparison:
      financesComparison,


    totalRecordsCount: {

      milk:
        milkRecords.length,

      cows:
        cows.length,

      expenses:
        expenses.length,

      sales:
        sales.length

    }

  };


  return createJsonResponse({

    success:
      true,

    data:
      data

  });
}


/* =====================================================
   EMPTY DASHBOARD
   ===================================================== */

function createDashboardResponse(
  farm,
  cows,
  milkRecords,
  expenses,
  sales,
  activities,
  userId
) {

  const emptyTrend = [];

  const emptyComparison = [];


  const kpis = {

    todayMilkLitres:
      0,

    todayRevenue:
      0,

    todayExpenses:
      0,

    monthNetMargin:
      0,

    herdSize:
      0,

    lactatingCows:
      0,

    outstandingReceivables:
      0,

    monthMilkLitres:
      0

  };


  return createJsonResponse({

    success:
      true,

    data: {

      kpis:
        kpis,

      farm:
        farm,

      todayMilk:
        0,

      todayRevenue:
        0,

      todayExpenses:
        0,

      estimatedMargin:
        0,

      cowCount:
        0,

      weeklyMilk:
        0,

      previousWeeklyMilk:
        0,

      productionChangePct:
        null,

      outstandingPayments:
        0,


      farmPulse: {

        status:
          'getting_started',

        title:
          'Welcome to DairyPulse',

        headline:
          'Welcome to DairyPulse',

        message:
          'Complete your farm setup and start recording milk, cows, expenses and sales.',

        summary:
          'Complete your farm setup and start recording milk, cows, expenses and sales.',

        actionHint:
          '+ Record Milk'

      },


      alerts:
        [],

      recentActivity:
        [],


      dailyMilkTrend:
        emptyTrend,

      milkTrend:
        emptyTrend,


      expenseBreakdown:
        [],


      financesComparison:
        emptyComparison,

      financialComparison:
        emptyComparison,


      totalRecordsCount: {

        milk:
          0,

        cows:
          0,

        expenses:
          0,

        sales:
          0

      }

    }

  });
}


/* =====================================================
   REPORTS
   ===================================================== */

function handleGetReportData(
  farmId,
  data
) {

  if (!farmId) {

    return createJsonResponse({

      success:
        true,

      data: {

        hasSufficientData:
          false,

        message:
          'No farm is associated with this account.'

      }

    });
  }


  const period =
    cleanString(
      data.period
    ) ||
    'this_month';


  const milkRecords =
    getRowsAsObjects(
      'MilkRecords'
    )
      .filter(
        function(r) {

          return sameId(
            r.farmId,
            farmId
          );

        });


  const expenses =
    getRowsAsObjects(
      'Expenses'
    )
      .filter(
        function(r) {

          return sameId(
            r.farmId,
            farmId
          );

        });


  const sales =
    getRowsAsObjects(
      'Sales'
    )
      .filter(
        function(r) {

          return sameId(
            r.farmId,
            farmId
          );

        });


  const cows =
    getRowsAsObjects(
      'Cows'
    )
      .filter(
        function(r) {

          return sameId(
            r.farmId,
            farmId
          );

        });


  const buyers =
    getRowsAsObjects(
      'Buyers'
    )
      .filter(
        function(r) {

          return sameId(
            r.farmId,
            farmId
          );

        });


  /* DATE RANGE */

  const range =
    getReportDateRange(
      period
    );


  const filteredMilk =
    filterByDateRange(
      milkRecords,
      'recordDate',
      range
    );


  const filteredExpenses =
    filterByDateRange(
      expenses,
      'expenseDate',
      range
    );


  const filteredSales =
    filterByDateRange(
      sales,
      'saleDate',
      range
    );


  if (
    filteredMilk.length === 0 &&
    filteredExpenses.length === 0 &&
    filteredSales.length === 0
  ) {

    return createJsonResponse({

      success:
        true,

      data: {

        period:
          period,

        hasSufficientData:
          false,

        message:
          'No records were found for the selected period.'

      }

    });
  }


  /* ===================================================
     PRODUCTION
     =================================================== */

  let totalLitres = 0;

  const dayLitresMap = {};


  filteredMilk.forEach(
    function(record) {

      const date =
        dateString(
          record.recordDate
        );


      const litres =
        parseNumber(
          record.totalLitres
        );


      totalLitres +=
        litres;


      if (date) {

        dayLitresMap[date] =
          (
            dayLitresMap[date] ||
            0
          ) +
          litres;
      }

    });


  const dates =
    Object.keys(
      dayLitresMap
    ).sort();


  let bestDay = null;

  let lowestDay = null;


  dates.forEach(
    function(date) {

      const litres =
        dayLitresMap[date];


      if (
        !bestDay ||
        litres >
          bestDay.litres
      ) {

        bestDay = {

          date:
            date,

          litres:
            round2(
              litres
            )

        };
      }


      if (
        !lowestDay ||
        litres <
          lowestDay.litres
      ) {

        lowestDay = {

          date:
            date,

          litres:
            round2(
              litres
            )

        };
      }

    });


  const avgDaily =
    dates.length > 0
      ? round2(
          totalLitres /
          dates.length
        )
      : 0;


  /* ===================================================
     FINANCIALS
     =================================================== */

  const totalRevenue =
    filteredSales.reduce(
      function(total, sale) {

        return (
          total +
          parseNumber(
            sale.totalAmount
          )
        );

      },
      0
    );


  const totalExpenseAmount =
    filteredExpenses.reduce(
      function(total, expense) {

        return (
          total +
          parseNumber(
            expense.amount
          )
        );

      },
      0
    );


  const margin =
    round2(
      totalRevenue -
      totalExpenseAmount
    );


  const costPerLitre =
    totalLitres > 0
      ? Math.round(
          totalExpenseAmount /
          totalLitres
        )
      : null;


  const outstanding =
    filteredSales.reduce(
      function(total, sale) {

        return (
          total +
          Math.max(
            0,
            parseNumber(
              sale.amountDue
            )
          )
        );

      },
      0
    );


  /* ===================================================
     EXPENSE CATEGORIES
     =================================================== */

  const categoryMap = {};


  filteredExpenses.forEach(
    function(expense) {

      const category =
        cleanString(
          expense.category
        ) ||
        'Other';


      categoryMap[category] =
        (
          categoryMap[category] ||
          0
        ) +
        parseNumber(
          expense.amount
        );

    });


  const expensesByCategory =
    Object.keys(
      categoryMap
    )
      .map(
        function(category) {

          return {

            category:
              category,

            amount:
              round2(
                categoryMap[
                  category
                ]
              ),

            percentage:
              totalExpenseAmount > 0
                ? Number(
                    (
                      (
                        categoryMap[
                          category
                        ] /
                        totalExpenseAmount
                      ) *
                      100
                    ).toFixed(1)
                  )
                : 0

          };

        })
      .sort(
        function(a, b) {

          return (
            b.amount -
            a.amount
          );

        });


  /* ===================================================
     SALES BY BUYER
     =================================================== */

  const buyersMap = {};


  buyers.forEach(
    function(buyer) {

      buyersMap[
        cleanString(
          buyer.buyerId
        )
      ] =
        cleanString(
          buyer.name
        );

    });


  const buyerSalesMap = {};


  filteredSales.forEach(
    function(sale) {

      const buyerName =
        buyersMap[
          cleanString(
            sale.buyerId
          )
        ] ||
        'Direct / Cash Buyer';


      if (
        !buyerSalesMap[
          buyerName
        ]
      ) {

        buyerSalesMap[
          buyerName
        ] = {

          litres:
            0,

          amount:
            0

        };
      }


      buyerSalesMap[
        buyerName
      ].litres +=
        parseNumber(
          sale.litres
        );


      buyerSalesMap[
        buyerName
      ].amount +=
        parseNumber(
          sale.totalAmount
        );

    });


  const salesByBuyer =
    Object.keys(
      buyerSalesMap
    )
      .map(
        function(buyerName) {

          return {

            buyerName:
              buyerName,

            litres:
              round2(
                buyerSalesMap[
                  buyerName
                ].litres
              ),

            amount:
              round2(
                buyerSalesMap[
                  buyerName
                ].amount
              )

          };

        });


  /* ===================================================
     HERD
     =================================================== */

  const lactatingCount =
    cows.filter(
      function(cow) {

        return (
          cleanString(
            cow.status
          ).toLowerCase() ===
          'lactating'
        );

      }).length;


  const litresPerLactating =
    (
      lactatingCount > 0 &&
      dates.length > 0
    )
      ? round2(
          avgDaily /
          lactatingCount
        )
      : null;


  /* ===================================================
     DAILY REPORT DATA
     =================================================== */

  const dailyData =
    dates.map(
      function(date) {

        return {

          date:
            date,

          litres:
            round2(
              dayLitresMap[date]
            )

        };

      });


  /* ===================================================
     RESPONSE
     =================================================== */

  return createJsonResponse({

    success:
      true,

    data: {

      period:
        period,

      startDate:
        range.startDate,

      endDate:
        range.endDate,

      hasSufficientData:
        true,


      summary: {

        milkChangePct:
          null,

        revenueChangePct:
          null,

        expensesChangePct:
          null,

        marginChangeAmount:
          null

      },


      production: {

        totalLitres:
          round2(
            totalLitres
          ),

        averageDailyLitres:
          avgDaily,

        bestDay:
          bestDay,

        lowestDay:
          lowestDay,

        dailyData:
          dailyData

      },


      financial: {

        revenue:
          round2(
            totalRevenue
          ),

        expenses:
          round2(
            totalExpenseAmount
          ),

        estimatedMargin:
          margin,

        costPerLitre:
          costPerLitre,

        outstandingPayments:
          round2(
            outstanding
          ),

        expensesByCategory:
          expensesByCategory,

        salesByBuyer:
          salesByBuyer

      },


      farmPerformance: {

        totalCows:
          cows.length,

        lactatingCows:
          lactatingCount,

        litresPerLactatingCow:
          litresPerLactating

      }

    }

  });
}


/* =====================================================
   REPORT DATE HELPERS
   ===================================================== */

function getReportDateRange(
  period
) {

  const today =
    todayString();


  const todayDate =
    localDateFromString(
      today
    );


  let startDate =
    '';

  let endDate =
    today;


  if (
    period === 'today'
  ) {

    startDate =
      today;

  }

  else if (
    period === 'this_week'
  ) {

    const d =
      localDateFromString(
        today
      );


    const day =
      d.getDay();


    const daysFromMonday =
      day === 0
        ? 6
        : day - 1;


    d.setDate(
      d.getDate() -
      daysFromMonday
    );


    startDate =
      Utilities.formatDate(
        d,
        CONFIG.TIMEZONE,
        'yyyy-MM-dd'
      );

  }

  else if (
    period === 'this_month'
  ) {

    startDate =
      Utilities.formatDate(
        new Date(
          todayDate.getFullYear(),
          todayDate.getMonth(),
          1,
          12,
          0,
          0
        ),
        CONFIG.TIMEZONE,
        'yyyy-MM-dd'
      );

  }

  else if (
    period === 'last_month'
  ) {

    const firstOfCurrent =
      new Date(
        todayDate.getFullYear(),
        todayDate.getMonth(),
        1,
        12,
        0,
        0
      );


    const firstOfLast =
      new Date(
        todayDate.getFullYear(),
        todayDate.getMonth() - 1,
        1,
        12,
        0,
        0
      );


    const lastOfLast =
      new Date(
        todayDate.getFullYear(),
        todayDate.getMonth(),
        0,
        12,
        0,
        0
      );


    startDate =
      Utilities.formatDate(
        firstOfLast,
        CONFIG.TIMEZONE,
        'yyyy-MM-dd'
      );


    endDate =
      Utilities.formatDate(
        lastOfLast,
        CONFIG.TIMEZONE,
        'yyyy-MM-dd'
      );

  }

  else if (
    period === 'last_7_days'
  ) {

    const d =
      localDateFromString(
        today
      );


    d.setDate(
      d.getDate() -
      6
    );


    startDate =
      Utilities.formatDate(
        d,
        CONFIG.TIMEZONE,
        'yyyy-MM-dd'
      );

  }

  else if (
    period === 'last_30_days'
  ) {

    const d =
      localDateFromString(
        today
      );


    d.setDate(
      d.getDate() -
      29
    );


    startDate =
      Utilities.formatDate(
        d,
        CONFIG.TIMEZONE,
        'yyyy-MM-dd'
      );

  }

  else {

    startDate =
      '';

  }


  return {

    startDate:
      startDate,

    endDate:
      endDate

  };
}


function filterByDateRange(
  records,
  field,
  range
) {

  if (
    !range.startDate
  ) {

    return records;
  }


  return records.filter(
    function(record) {

      const date =
        dateString(
          record[field]
        );


      return (
        date >=
          range.startDate &&
        date <=
          range.endDate
      );

    });
}