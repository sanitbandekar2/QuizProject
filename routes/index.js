var express = require("express");
var router = express.Router();
var User = require("../models/user");
const quizNameModel = require("../models/quizNameModel");
const QuestionModel = require("../models/qustionsModel");
const resultModel = require("../models/resultModel");
const QuizName = require("../models/quizNameModel");
const section = require("../models/sectionModel");
const fs = require("fs").promises;

router.get("/", function (req, res, next) {
  console.log(req.session.userId);
  if (req.session.userId) {
    res.redirect("/home");
  } else {
    return res.render("login.ejs");
  }
});

router.post("/signup", function (req, res, next) {
  console.log(req.body);
  var personInfo = req.body;

  if (
    !personInfo.email ||
    !personInfo.username ||
    !personInfo.password ||
    !personInfo.passwordConf
  ) {
    res.send();
  } else {
    if (personInfo.password == personInfo.passwordConf) {
      User.findOne({ email: personInfo.email }, function (err, data) {
        if (!data) {
          var c;
          User.findOne({}, function (err, data) {
            if (data) {
              console.log("if");
              c = data.unique_id + 1;
            } else {
              c = 1;
            }

            var newPerson = new User({
              unique_id: c,
              email: personInfo.email,
              username: personInfo.username,
              password: personInfo.password,
              passwordConf: personInfo.passwordConf,
            });

            newPerson.save(function (err, Person) {
              if (err) console.log(err);
              else console.log("Success");
            });
          })
            .sort({ _id: -1 })
            .limit(1);
          res.send({ Success: "You are regestered,You can login now." });
        } else {
          res.send({ Success: "Email is already used." });
        }
      });
    } else {
      res.send({ Success: "password is not matched" });
    }
  }
});

router.get("/login", function (req, res, next) {
  if (req.session.userId) {
    res.redirect("/home");
  } else {
    return res.render("login.ejs");
  }
});

router.post("/login", function (req, res, next) {
  // console.log(req.body);
  try {
    User.findOne({ email: req.body.email }, function (err, data) {
      if (data) {
        if (data.password == req.body.password) {
          //console.log("Done Login");
          req.session.userId = data.unique_id;
          if (req.session.lastId) {
            const url = "/link/quiz/" + req.session.lastId;
            console.log(url);

            return res.send({
              Success: "Success!",
              url: "/link/quiz/0326dcfc-ba65-4c5c-babc-42000dd597d0",
            });
          } else {
            res.send({ Success: "Success!", url: "/home" });
          }
        } else {
          res.send({ Success: "Wrong password!" });
        }
      } else {
        res.send({ Success: "This Email Is not regestered!" });
      }
    });
  } catch (error) {
    next(error);
    console.log(error);
  }
});

router.get("/home", async (req, res, next) => {
  console.log("home");

  const data = await User.findOne({ unique_id: req.session.userId });
  // console.log("data");
  // console.log(data);
  const sectionList = await section.find();
  if (!data) {
    res.redirect("/");
  } else {
    //console.log("found");
    return res.render("userhome.ejs", {
      name: data.username,
      email: data.email,
      array: sectionList,
    });
  }
});
router.get("/profile", async (req, res, next) => {
  try {
    console.log(req.session.userId);
    let quiz = [];

    const result = await resultModel.find({ userId: req.session.userId });
    console.log(result);

    console.log(quiz);
    User.findOne({ unique_id: req.session.userId }, function (err, data) {
      if (!data) {
        res.redirect("/");
      } else {
        return res.render("userprofile.ejs", {
          name: data.username,
          email: data.email,
          array: result,
          quiz: quiz,
        });
      }
    });
  } catch (error) {
    next(error);
    console.log(error);
  }
});

router.post("/result", async (req, res, next) => {
  try {
    const { questionLimit, quiz_id, score, quizname } = req.body;

    const result = new resultModel({
      quiz_id: quiz_id,
      score: score,
      questionLimit: questionLimit,
      userId: req.session.userId,
      quizname: quizname,
    });

    // const existing = await resultModel.find({ quiz_id: quiz_id });

    // if (existing.length === 0) {
    result.save(function (err, data) {
      if (err) console.log(err);
      else console.log("added");
    });
    // }

    // const result = await resultModel.create()
  } catch (error) {
    next(error);
    console.log(error);
  }
});
router.get("/quiz/:section/:levels", async (req, res, next) => {
  try {
    const { section, levels } = req.params;
    console.log(levels);

    const user = await User.findOne({ unique_id: req.session.userId });
    // console.log("data");
    // console.log(user);
    if (!user) {
      res.redirect("/");
    } else {
      const quizName = await quizNameModel.findOne({
        department: section,
        levels: levels,
      });
      console.log(quizName);

      const data = await QuestionModel.find({ quiz_id: quizName.quiz_id });

      console.log(data);

      fs.writeFile("public/file.json", JSON.stringify(data))
        .then(() => {
          console.log("JSON saved");
          return res.render("quiz.ejs", {
            title: quizName.quizName,
            filelocation: "/public/file.json",
          });
        })
        .catch((er) => {
          console.log(er);
        });

      // return res.send({ data });
    }
  } catch (error) {
    next(error);
  }
});

router.get("/logout", function (req, res, next) {
  console.log("logout");
  if (req.session) {
    // delete session object
    req.session.destroy(function (err) {
      if (err) {
        return next(err);
      } else {
        return res.redirect("/");
      }
    });
  }
});

router.get("/forgetpass", function (req, res, next) {
  res.render("forget.ejs");
});

router.post("/forgetpass", function (req, res, next) {
  //console.log('req.body');
  //console.log(req.body);
  User.findOne({ email: req.body.email }, function (err, data) {
    console.log(data);
    if (!data) {
      res.send({ Success: "This Email Is not regestered!" });
    } else {
      // res.send({"Success":"Success!"});
      if (req.body.password == req.body.passwordConf) {
        data.password = req.body.password;
        data.passwordConf = req.body.passwordConf;

        data.save(function (err, Person) {
          if (err) console.log(err);
          else console.log("Success");
          res.send({ Success: "Password changed!" });
        });
      } else {
        res.send({
          Success: "Password does not matched! Both Password should be same.",
        });
      }
    }
  });
});

module.exports = router;
