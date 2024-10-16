import { Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { RendererFunction } from "../types/renderer-props";
import { FieldValues } from "react-hook-form";
const renderSelect: RendererFunction<FieldValues> = ({
  field,
  inputProps,
  errorMessage,
  optionList,
  title,
  name,
}) => {
  return (
    <FormControl fullWidth error={!!errorMessage}>
      {title && <InputLabel id={name}>{title}</InputLabel>}
      <Select
        labelId={name}
        {...field}
        {...inputProps}
        label={title}
        inputRef={field?.ref}
        displayEmpty
        value={(field?.value as string) ?? ""}
      >
        {optionList?.map((option, index) => (
          <MenuItem key={index} value={String(option.value)}>
            {option.title}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default renderSelect;
