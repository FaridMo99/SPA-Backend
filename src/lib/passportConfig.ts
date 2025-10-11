import { Strategy as LocalStrategy, VerifyFunction } from "passport-local";
import passport from "passport";
import prisma from "../db/client";
import bcrypt from "bcrypt";

const verify: VerifyFunction = async (email, password, done) => {
  try {
    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      return done(null, false, { message: "Email or Password is wrong" });
    }

    const comparePassword = await bcrypt.compare(password, user.password);

    if (!comparePassword) {
      //not specifying that only password is wrong,
      //is on purpose for security reasons
      return done(null, false, { message: "Email or Password is wrong" });
    }

    return done(null, user);
  } catch (err) {
    done(err);
  }
};

//store user id in session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

//attach user to req.body
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err);
  }
});

passport.use(new LocalStrategy({ usernameField: "email" }, verify));

export default passport;
