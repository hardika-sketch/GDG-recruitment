export function validateName(name) {
  if (!name || name.trim().length === 0) {
    return "Name is required.";
  }
  const cleanName = name.trim();
  if (cleanName.length < 3) {
    return "Name must be at least 3 characters long.";
  }
  if (!/^[a-zA-Z\s]+$/.test(cleanName)) {
    return "Name can only contain letters and spaces.";
  }
  return null;
}

export function validateYear(year) {
  if (!year) {
    return "Please select your academic year.";
  }
  const numYear = parseInt(year, 10);
  if (isNaN(numYear) || numYear < 1 || numYear > 4) {
    return "Academic year must be between 1st Year and 4th Year.";
  }
  return null;
}

export function validateBranch(branch) {
  if (!branch || branch.trim().length === 0) {
    return "Academic branch/department is required.";
  }
  const cleanBranch = branch.trim();
  if (cleanBranch.length < 2) {
    return "Branch name must be at least 2 characters long.";
  }
  if (!/^[a-zA-Z\s\-\.\&]+$/.test(cleanBranch)) {
    return "Branch contains invalid characters.";
  }
  return null;
}

export function validateRole(role) {
  if (!role || role.trim().length === 0 || role === "Select a Role") {
    return "Please select the role you are applying for.";
  }
  return null;
}

export function validateWhyYou(whyYou) {
  if (!whyYou || whyYou.trim().length === 0) {
    return "Please tell us why you want to join.";
  }
  const length = whyYou.trim().length;
  if (length < 20) {
    return `Explanation is too short. Please write at least 20 characters (current: ${length}).`;
  }
  if (length > 500) {
    return `Explanation is too long. Please limit to 500 characters (current: ${length}).`;
  }
  return null;
}

export function validateEmail(email) {
  if (!email || email.trim().length === 0) {
    return "Email is required.";
  }
  // Standard email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return "Please enter a valid email address.";
  }
  return null;
}

export function validatePhone(phone) {
  if (!phone || phone.trim().length === 0) {
    return "Phone number is required.";
  }
  // Standard phone check (digits, spaces, hyphens, plus sign)
  const phoneRegex = /^\+?[0-9\s\-]{10,15}$/;
  if (!phoneRegex.test(phone.trim())) {
    return "Please enter a valid phone number (at least 10 digits).";
  }
  return null;
}

export function checkPasswordCriteria(password) {
  const p = password || "";
  return {
    minLength: p.length >= 8,
    hasUpper: /[A-Z]/.test(p),
    hasLower: /[a-z]/.test(p),
    hasNumber: /[0-9]/.test(p),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(p)
  };
}

export function validatePassword(password) {
  if (!password) {
    return "Password is required.";
  }
  const criteria = checkPasswordCriteria(password);
  if (!criteria.minLength) return "Password must be at least 8 characters long.";
  if (!criteria.hasUpper) return "Password must contain at least one uppercase letter.";
  if (!criteria.hasLower) return "Password must contain at least one lowercase letter.";
  if (!criteria.hasNumber) return "Password must contain at least one number.";
  if (!criteria.hasSpecial) return "Password must contain at least one special character.";
  return null;
}

