import { useContext, useState, type SubmitEvent } from "react";
import { assets } from "../../assets/assets";
import { AdminContext } from "../../context/AdminContext";
import { toast } from "react-toastify";
import axios from "axios";
import type { MessageResponse } from "../../types/admin";
import { getErrorMessage } from "../../utils/getErrorMessage";

const EXPERIENCE_OPTIONS = [
  "1 Year",
  "2 Years",
  "3 Years",
  "4 Years",
  "5 Years",
  "6 Years",
  "7 Years",
  "8 Years",
  "9 Years",
  "10 Years",
];

const LOCATION_OPTIONS = [
  "Newcastle upon Tyne",
  "Sunderland",
  "Gateshead",
  "South Shields",
  "Tynemouth",
  "Durham",
];

// Letters (any language), optionally separated by single spaces, hyphens or apostrophes.
const NAME_REGEX = /^[\p{L}\p{M}]+(?:[ '’-][\p{L}\p{M}]+)*$/u;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
// The only special characters a password may contain (at least one is required).
const PASSWORD_SPECIAL_CHARS = ["$", "&", "%", "+"];
const PASSWORD_SPECIAL_CHARS_LABEL = "$, &, % or +";
const PASSWORD_ALLOWED_CHARS_REGEX = /^[A-Za-z0-9$&%+]+$/;

// Returns the first password strength error, or null if the password is strong.
const getPasswordError = (password: string) => {
  if (!password) return "Password is required";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must include at least one capital letter";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must include at least one small letter";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must include at least one number";
  }
  if (!PASSWORD_ALLOWED_CHARS_REGEX.test(password)) {
    return `Password can only contain letters, numbers and the special characters ${PASSWORD_SPECIAL_CHARS_LABEL}`;
  }
  if (!PASSWORD_SPECIAL_CHARS.some((char) => password.includes(char))) {
    return `Password must include at least one special character (${PASSWORD_SPECIAL_CHARS_LABEL})`;
  }
  return null;
};

const AddCompanion = () => {
  const [compImg, setCompImg] = useState<File | false>(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [experience, setExperience] = useState("1 Year");
  const [fees, setFees] = useState("");
  const [about, setAbout] = useState("");
  const [location, setLocation] = useState("Gateshead");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");

  const { backendUrl, adminToken } = useContext(AdminContext);

  // Returns the first validation error message, or null if every field is valid.
  const validateForm = () => {
    if (!compImg) return "Please upload a companion picture";
    if (!compImg.type.startsWith("image/")) {
      return "Companion picture must be an image file";
    }

    const trimmedFirstName = firstName.trim();
    if (!trimmedFirstName) return "First name is required";
    if (!NAME_REGEX.test(trimmedFirstName)) {
      return "First name can only contain letters, spaces, hyphens and apostrophes";
    }

    const trimmedLastName = lastName.trim();
    if (!trimmedLastName) return "Last name is required";
    if (!NAME_REGEX.test(trimmedLastName)) {
      return "Last name can only contain letters, spaces, hyphens and apostrophes";
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) return "Email is required";
    if (!EMAIL_REGEX.test(trimmedEmail)) return "Please enter a valid email address";

    const passwordError = getPasswordError(password);
    if (passwordError) return passwordError;
    if (!confirmPassword) return "Please confirm the password";
    if (password !== confirmPassword) return "Passwords do not match";

    if (!EXPERIENCE_OPTIONS.includes(experience)) {
      return "Please select a valid experience";
    }

    if (fees.trim() === "") return "Fees is required";
    const feesValue = Number(fees);
    if (!Number.isFinite(feesValue)) return "Fees must be a valid number";
    if (feesValue < 0) return "Fees cannot be a negative number";

    if (!LOCATION_OPTIONS.includes(location)) {
      return "Please select a valid location";
    }

    if (!address1.trim()) return "Address line 1 is required";
    if (!address2.trim()) return "Address line 2 is required";

    return null;
  };

  const onSubmitHandler = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    // validateForm() has already rejected a missing image; this check lets
    // TypeScript know compImg is a File from here on.
    if (!compImg) return;

    try {
      const formData = new FormData();

      formData.append("image", compImg);
      formData.append("firstName", firstName.trim());
      formData.append("lastName", lastName.trim());
      formData.append("email", email.trim());
      formData.append("password", password);
      formData.append("experience", experience);
      formData.append("fees", fees);
      formData.append("about", about);
      formData.append("location", location);
      formData.append(
        "address",
        JSON.stringify({ line1: address1.trim(), line2: address2.trim() }),
      );

      const { data } = await axios.post<MessageResponse>(
        backendUrl + "/api/admin/add-companion",
        formData,
        { headers: { adminToken } },
      );
      if (data.success) {
        toast.success(data.message);
        setCompImg(false);
        setFirstName("");
        setLastName("");
        setPassword("");
        setConfirmPassword("");
        setEmail("");
        setAddress1("");
        setAddress2("");
        setFees("");
        setAbout("");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <form className="m-5 w-full" onSubmit={onSubmitHandler}>
      <p className="mb-3 text-lg font-medium">Add Companion</p>
      <div className="bg-white px-8 py-8 border rounded w-full max-w-4xl max-h-[80vh] overflow-y-scroll">
        <div className="flex items-center gap-4 mb-8 text-gray-500">
          <label htmlFor="comp-img">
            <img
              className="w-16 bg-gray-100 rounded-full cursor-pointer"
              src={compImg ? URL.createObjectURL(compImg) : assets.upload_area}
            />
          </label>
          <input
            onChange={(e) => setCompImg(e.target.files?.[0] ?? false)}
            type="file"
            id="comp-img"
            hidden
          />
          <p>
            Upload companion <br /> picture
          </p>
        </div>
        <div className="flex flex-col lg:flex-row items-start gap-10 text-gray-600">
          <div className="w-full lg:flex-1 flex flex-col gap-4">
            <div className="flex-1 flex flex-col gap-1">
              <p>Companion First Name</p>
              <input
                onChange={(e) => setFirstName(e.target.value)}
                value={firstName}
                className="border rounded px-3 py-2"
                type="text"
                placeholder="First Name"
                required
              />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <p>Companion Last Name</p>
              <input
                onChange={(e) => setLastName(e.target.value)}
                value={lastName}
                className="border rounded px-3 py-2"
                type="text"
                placeholder="Last Name"
                required
              />
            </div>

            <div className="flex-1 flex flex-col gap-1">
              <p>Companion Email</p>
              <input
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                className="border rounded px-3 py-2"
                type="email"
                placeholder="Email"
                required
              />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <p>Companion Password</p>
              <input
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                className="border rounded px-3 py-2"
                type="password"
                placeholder="Password"
                required
              />
              <p className="text-gray-400 text-xs">
                At least {MIN_PASSWORD_LENGTH} characters, including a capital
                letter, a small letter, a number and one of{" "}
                {PASSWORD_SPECIAL_CHARS_LABEL}
              </p>
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <p>Confirm Password</p>
              <input
                onChange={(e) => setConfirmPassword(e.target.value)}
                value={confirmPassword}
                className="border rounded px-3 py-2"
                type="password"
                placeholder="Confirm Password"
                required
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-red-500 text-xs">Passwords do not match</p>
              )}
            </div>

            <div className="flex-1 flex flex-col gap-1">
              <p>Experience</p>
              <select
                className="border rounded px-3 py-2"
                name="Experience"
                id=""
                onChange={(e) => setExperience(e.target.value)}
                value={experience}
              >
                {EXPERIENCE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <p>Fees</p>
              <input
                onChange={(e) => setFees(e.target.value)}
                value={fees}
                className="border rounded px-3 py-2"
                type="number"
                placeholder="fees"
                required
              />
            </div>
          </div>
          <div className="w-full lg:flex-1 flex flex-col gap-4">
            <div className="flex-1 flex flex-col gap-1">
              <p>Location</p>
              <select
                className="border rounded px-3 py-2"
                name="Location"
                id=""
                onChange={(e) => setLocation(e.target.value)}
                value={location}
              >
                {LOCATION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <p>Address</p>
              <input
                onChange={(e) => setAddress1(e.target.value)}
                value={address1}
                className="border rounded px-3 py-2"
                type="text"
                placeholder="address 1"
                required
              />
              <input
                onChange={(e) => setAddress2(e.target.value)}
                value={address2}
                className="border rounded px-3 py-2"
                type="text"
                placeholder="address 2"
                required
              />
            </div>
          </div>
        </div>
        <div>
          <p className="mt-4 mb-2">About Companion</p>
          <textarea
            onChange={(e) => setAbout(e.target.value)}
            value={about}
            className="w-full px-4 pt-2 border rounded"
            placeholder="About the companion"
            rows={5}
          />
        </div>
        <button
          type="submit"
          className="bg-primary px-10 py-3 mt-4 text-white rounded-full"
        >
          Add Companion
        </button>
      </div>
    </form>
  );
};

export default AddCompanion;
