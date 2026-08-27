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
