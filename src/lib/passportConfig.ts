import { Strategy as LocalStrategy, VerifyFunction } from "passport-local";
import passport from "passport";
import prisma from "../db/client";
import bcrypt from "bcrypt";
import chalk from "chalk";

const verify: VerifyFunction = async (email, password, done) => {
  try {
    const user = await prisma.user.findFirst({
      where: { email },
      include: {
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
    });
    
    if (!user) {
      console.log("no user " + user);
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
passport.serializeUser((user:any, done) => {
  console.log("hit serialize user")
  console.log(chalk.bgRed(user));
  done(null, user.id);
});

//attach user to req.body
passport.deserializeUser(async (id: string, done) => {
    console.log("hit deserialize user");

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
    });
    done(null, user);
  } catch (err) {
    done(err);
  }
});

passport.use(new LocalStrategy({ usernameField: "email" }, verify));

export default passport;
