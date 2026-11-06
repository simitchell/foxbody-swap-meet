// These values must match Category and Fits in the backend's models.py.
export const CATEGORY_OPTIONS = [
  { value: "engine", label: "Engine" },
  { value: "drivetrain", label: "Drivetrain" },
  { value: "suspension_brakes", label: "Suspension & Brakes" },
  { value: "exterior", label: "Exterior" },
  { value: "interior", label: "Interior" },
  { value: "wheels_tires", label: "Wheels & Tires" },
  { value: "other", label: "Other" },
];

export const FIT_OPTIONS = [
  {
    value: "four_eye",
    title: "Four-eye ('79–'86)",
    example: "Only fits early cars, like four-eye headlight bezels.",
  },
  {
    value: "aero",
    title: "Aero ('87–'93)",
    example: "Only fits later cars, like aero taillights or a Cobra R hood.",
  },
  {
    value: "all",
    title: "All Fox Bodies ('79–'93)",
    example: "Fits either generation, like a K-member, a T-5, or engine parts.",
  },
];

// A nicer first check than a toast from the server. The API still enforces
// these rules, since anyone can call it without using our forms.
export function listingChoiceErrors(formData) {
  const errors = {};
  if (!formData.get("category")) errors.category = "Choose a category.";
  if (!formData.get("fits")) errors.fits = "Choose which cars it fits.";
  return errors;
}

// On a phone the missing field can be a long way up the page.
export function focusFirstChoiceError(form, errors) {
  if (errors.category) form.elements.category.focus();
  else if (errors.fits) form.elements.fits[0].focus();
}
