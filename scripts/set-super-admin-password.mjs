import readline from "readline";
import { createClient } from "@supabase/supabase-js";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!rawUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  process.exit(1);
}

const supabaseAdmin = createClient(rawUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const stdin = process.stdin;
    process.stdout.write(question);

    let password = "";
    const onData = (char) => {
      char = char + "";
      switch (char) {
        case "\n":
        case "\r":
        case "\u0004":
          stdin.removeListener("data", onData);
          break;
        case "\u0003":
          process.exit();
          break;
        case "\u007f": // Backspace
        case "\b":
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write("\b \b");
          }
          break;
        default:
          process.stdout.write("*");
          password += char;
          break;
      }
    };

    stdin.on("data", onData);

    rl.question("", () => {
      rl.close();
      console.log("");
      resolve(password);
    });
  });
}

async function main() {
  console.log("=== NEXT GEN DMA VENTURES CRM ===");
  console.log("Secure Password Update for Super Admin (info@datamintaarvix.com)");
  console.log("Your input will be masked with asterisks (*).\n");

  const pwd1 = await askHidden("Enter new confidential password: ");
  if (!pwd1 || pwd1.length < 8) {
    console.error("\nError: Password must be at least 8 characters long.");
    process.exit(1);
  }

  const pwd2 = await askHidden("Confirm new password: ");
  if (pwd1 !== pwd2) {
    console.error("\nError: Passwords do not match.");
    process.exit(1);
  }

  console.log("\nUpdating password securely via Supabase Auth Admin API...");
  const targetId = "280c105c-d5ba-419b-9f38-158268d04896";

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(targetId, {
    password: pwd1,
  });

  if (error) {
    console.error("Failed to update password:", error.message);
    process.exit(1);
  }

  console.log(`\nPassword updated successfully for Super Admin (${data.user.email})!`);
  console.log("You can now log in at http://localhost:3000/login with info@datamintaarvix.com.");
}

main().catch(console.error);
