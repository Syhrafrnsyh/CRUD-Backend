import express from 'express';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import SequelizeStore from 'connect-session-sequelize';
import db from './config/Database.js';
import UserRoute from './routes/UserRoute.js';
// import ProductRoute from "./routes/ProductRoute.js";
import AuthRoute from './routes/AuthRoute.js';
// import FileUpload from "express-fileupload";

dotenv.config();

const app = express();

const sessionStore = SequelizeStore(session.Store);

const store = new sessionStore({
  db,
});

// (async()=>{
//     await db.sync();
// })();

app.use(
  session({
    secret: process.env.SESS_SECRET,
    resave: false,
    saveUninitialized: true,
    store,
    cookie: {
      secure: 'auto',
    },
  }),
);

app.use(
  cors({
    credentials: true,
    origin: 'http://localhost:3000',
  }),
);
app.use(express.json());
app.use(UserRoute);
app.use(AuthRoute);
// app.use(FileUpload());
// app.use(express.static("public"));
// app.use(ProductRoute);
// store.sync();

app.listen(process.env.APP_PORT, () => {
  console.log('Server up and running...');
});
