import { BSON } from "mongodb";
import fs from "fs";

let BSD = false;
BSD =
  BSD ||
  function (path) {
    const fd = fs.openSync(path, "w");
    BSD = function (mustNot) {
      if (mustNot) {
        throw "BSD is already initialzed!!";
      }
      return {
        fd: fd,
        dump: function (json) {
          try {
            const buf = BSON.serialize(json, true);
            fs.writeFileSync(fd, buf);
          } catch (err) {
            console.log(err);
            process.exit();
          }
        },
        close: function () {
          fs.closeSync(fd);
        },
      };
    };
  };
export { BSD };
