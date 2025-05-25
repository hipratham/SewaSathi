const admin = require('firebase-admin');

const serviceAccount = {
  "type": "service_account",
  "project_id": "sewasathi-1076b",
  "private_key_id": "0512bea057973945db2b697b7b34f3d5703652a0",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDZ2HQmwi3XcDMs\nEQMKHpLhgIXLhH8pF4Q9UNn9z9U8ickXYsrSx/l1HwpJRzKeoe9oAVnMXyS3aPNd\nYDKhkrD56e4zLJEkU4MutSvUsphVqpqrolMYNtQQsJcJ+WDQYxnA/+JjjZQeakf2\nq6tKeop0XR48cpkrNIh8uGU+HPtfPK6JNUOe+swXk23KxUkccEeRM3xBlV1ATEp1\nfdT3UYvphgliDVMyXYN6PtiQBmli8mdw1QrADJDC1RmkdXHTpwPqaXc5wKoFn6lY\nca3Ean+WrlAOvNJ4i/9fQUXJ+yTEnKcm/xGHwZ5qFHBiLy3XZbQzLpogdUZZFlP7\nfgq3IlUpAgMBAAECggEACSroyHDHiRd5r9MPc6+Rste7ybLLvyj0MbhjVCEY8jFC\nOy+3JWOxBdLGlgrfAHoEHzZfVxBx9R3/j+BqgQ4xUHMdyR2JBiRVkvOg4pSZgJFr\nbOmp4Yz9I66qzIqoHlztSof6OQJOR3FlkeXrkXjSts7sZNLVy1GspMMFz7Vchsdt\nC40ypwyySC2ozrla+OtEAOja9cHyivDhd5yOTilravucoQRfwlKSZ8xVAeOEkjTy\ntvPFGL9yDLqFHJOtY0j7BZFsKAxwivxdh1B1lons07C/iyO1xnVRbjHPCAXPj59u\nEMyhW/IkX8qq6iFLepvFtSCfKICF3JdyNH8SeuNVAQKBgQD9pwUk3vne7irBvc8Y\n4HID7HwCZIR+yNuwpcQQvc5yQKYprZJ14I3OU753dd2sCwlt4R7cRK1RVLbtv++z\nSLRiPmTaS+TdcemCljsDbSZvEXFjkRUGxbQDj9smi5JMQ/PRAdoE4zAQtryd3vPL\nnq9N3G4H6fmnFI7yiV8FcDbBUQKBgQDb3JieE8naVKs52GjxdkM8widuHHidaNPh\nm+3whsO+GdWzF7SG7nZYqpwmmsKYDhG7AmSuJ8huwKzxwuFE26ryAQAu5IVrua8M\nnOaR7d3VtSxJgf6XVP48dW7rR50MuHIZ4hA+J90Ue43HTNHKMJ0fhp4D6Cvys/pn\nk8oXeT8gWQKBgQDdbnzzHySLFOeGkqjEUsu12TC49f8knzwKDewHoWskGoP0Rm5h\nMVMaF8liiCaoFkp4/dnu+JVFNusq4qFypbmzOjzYxQBawSLUuUlzSEoRE+0kunbc\nnqLzqRXrpFRm97tVboRhV+OR87TdLNEvpKvtEM2NYxhqX2wbFwk4uilSwQKBgG9Y\nSppT3zgJBSYoaQ1QHUEZ+qoTFSpyuktZkqjrNxqBLu6iJLTo81p4HNiYK9Ch32zc\nC2z/jMw6G9vcHAWpUet5gkQ9SyyBPxueIk7pLh1awXEAupSdYJvxxRi2jdyxVGez\nSxKPUbFb2TODvgMtl4UtwbysygUCDOCDwicdKlERAoGAC+TW0DHb2oxxzfz5LGfZ\n7WxCmuggKh3aOM6Ap1BFhiLMAthfUkdoTGOpvUs71lxzm5Fzxstpzhh3kf6UElEK\nQnS3zej/RJtfhuRxKnW8rEB5fDMeqQ+TZApcp8++m6++6EXKrZzLDzxXdf5fvC6T\ncn0ZIh4wWq8HXqS/1rKA6jQ=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@sewasathi-1076b.iam.gserviceaccount.com",
  "client_id": "117392100587389745823",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40sewasathi-1076b.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://sewasathi-1076b-default-rtdb.firebaseio.com" // Replace with your Realtime Database URL
});

module.exports = admin;
