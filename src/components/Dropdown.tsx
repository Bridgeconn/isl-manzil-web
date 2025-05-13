import Select from "react-select";
import { DropdownProps } from "../types/Navigation";

const Dropdown = ({
  options,
  value,
  onChange,
  placeholder,
  formatOptionLabel,
  zIndex = "z-10"
}: DropdownProps) => {

  return (
    <div className={`relative ${zIndex}`}>
    <Select
      options={options}
      value={value}
      formatOptionLabel={formatOptionLabel}
      onChange={onChange}
      placeholder={placeholder}
    />
    </div>
  );
};

export default Dropdown;
