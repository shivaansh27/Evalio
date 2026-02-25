import { useState, useEffect } from "react";
import { Check, X, AlertCircle, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * FormInput - A reusable input component with real-time validation
 *
 * @param {Object} props
 * @param {string} props.label - Input label
 * @param {string} props.type - Input type (text, email, password, etc.)
 * @param {string} props.name - Input name
 * @param {string} props.value - Current value
 * @param {function} props.onChange - Change handler
 * @param {string} props.placeholder - Placeholder text
 * @param {function} props.validate - Validation function, returns { valid: boolean, message?: string }
 * @param {boolean} props.required - Whether field is required
 * @param {string} props.icon - Lucide icon component to show on the left
 * @param {boolean} props.showSuccessIcon - Show green checkmark when valid
 * @param {string} props.helperText - Helper text shown below input
 * @param {boolean} props.disabled - Disabled state
 * @param {string} props.autoComplete - Autocomplete attribute
 */
export default function FormInput({
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  validate,
  required = false,
  icon: Icon,
  showSuccessIcon = true,
  helperText,
  disabled = false,
  autoComplete,
  className = "",
  ...props
}) {
  const [touched, setTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validation, setValidation] = useState({ valid: true, message: "" });

  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  useEffect(() => {
    if (!touched) return;

    if (validate) {
      const result = validate(value);
      setValidation(result);
    } else if (required && !value?.trim()) {
      setValidation({
        valid: false,
        message: `${label || "This field"} is required`,
      });
    } else {
      setValidation({ valid: true, message: "" });
    }
  }, [value, touched, validate, required, label]);

  const handleBlur = () => {
    setTouched(true);
  };

  const showError = touched && !validation.valid;
  const showSuccess =
    touched && validation.valid && value?.trim() && showSuccessIcon;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
       
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon
              className={`w-5 h-5 ${showError ? "text-red-400" : "text-gray-400"}`}
            />
          </div>
        )}

    
        <input
          id={name}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`
            block w-full rounded-lg border bg-white px-4 py-2.5 text-sm
            transition-all duration-200 ease-out
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${Icon ? "pl-10" : ""}
            ${isPassword || showSuccess || showError ? "pr-10" : ""}
            ${
              showError
                ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                : showSuccess
                  ? "border-green-300 focus:border-green-500 focus:ring-green-200"
                  : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-200"
            }
          `}
          {...props}
        />

        <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1">
        
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600 focus:outline-none p-1"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}

        
          <AnimatePresence mode="wait">
            {showError && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                <X className="w-5 h-5 text-red-500" />
              </motion.div>
            )}
            {showSuccess && !isPassword && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                <Check className="w-5 h-5 text-green-500" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showError && validation.message ? (
          <motion.p
            key="error-text"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="text-xs text-red-600 flex items-center gap-1"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            {validation.message}
          </motion.p>
        ) : helperText ? (
          <motion.p
            key="helper-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-gray-500"
          >
            {helperText}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export const validators = {
  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value?.trim()) return { valid: false, message: "Email is required" };
    if (!emailRegex.test(value))
      return { valid: false, message: "Please enter a valid email" };
    return { valid: true };
  },

  password: (value, minLength = 6) => {
    if (!value) return { valid: false, message: "Password is required" };
    if (value.length < minLength) {
      return {
        valid: false,
        message: `Password must be at least ${minLength} characters`,
      };
    }
    return { valid: true };
  },

  confirmPassword: (password) => (value) => {
    if (!value)
      return { valid: false, message: "Please confirm your password" };
    if (value !== password)
      return { valid: false, message: "Passwords do not match" };
    return { valid: true };
  },

  required: (fieldName) => (value) => {
    if (!value?.trim())
      return { valid: false, message: `${fieldName} is required` };
    return { valid: true };
  },

  minLength: (min, fieldName) => (value) => {
    if (!value || value.length < min) {
      return {
        valid: false,
        message: `${fieldName} must be at least ${min} characters`,
      };
    }
    return { valid: true };
  },

  name: (value) => {
    if (!value?.trim()) return { valid: false, message: "Name is required" };
    if (value.trim().length < 2)
      return { valid: false, message: "Name must be at least 2 characters" };
    return { valid: true };
  },
};
