import { Field as FormField, type FormApi } from "@tanstack/react-form"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { Textarea } from "~/components/ui/textarea"
import { Checkbox } from "~/components/ui/checkbox"
import { Switch } from "~/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import type { ComponentProps } from "react"

interface BaseFieldProps {
  form: any
  name: string
  label?: string
  description?: string
}

export function FormInput({
  form,
  name,
  label,
  description,
  ...props
}: BaseFieldProps & Omit<ComponentProps<typeof Input>, 'form'>) {
  return (
    <form.Field
      name={name}
      children={(field: any) => {
        const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
        return (
          <Field data-invalid={isInvalid}>
            {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
            <Input
              id={field.name}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              aria-invalid={isInvalid}
              {...props}
            />
            {description && <FieldDescription>{description}</FieldDescription>}
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        )
      }}
    />
  )
}

export function FormTextarea({
  form,
  name,
  label,
  description,
  ...props
}: BaseFieldProps & Omit<ComponentProps<typeof Textarea>, 'form'>) {
  return (
    <form.Field
      name={name}
      children={(field: any) => {
        const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
        return (
          <Field data-invalid={isInvalid}>
            {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
            <Textarea
              id={field.name}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              aria-invalid={isInvalid}
              {...props}
            />
            {description && <FieldDescription>{description}</FieldDescription>}
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        )
      }}
    />
  )
}

export function FormCheckbox({
  form,
  name,
  label,
  description,
  ...props
}: BaseFieldProps & Omit<ComponentProps<typeof Checkbox>, 'form'>) {
  return (
    <form.Field
      name={name}
      children={(field: any) => {
        const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
        return (
          <Field orientation="horizontal" data-invalid={isInvalid}>
            <Checkbox
              id={field.name}
              name={field.name}
              checked={field.state.value}
              onCheckedChange={(checked) => field.handleChange(checked)}
              aria-invalid={isInvalid}
              {...props}
            />
            <FieldContent>
              {label && (
                <FieldLabel htmlFor={field.name} className="font-normal">
                  {label}
                </FieldLabel>
              )}
              {description && <FieldDescription>{description}</FieldDescription>}
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </FieldContent>
          </Field>
        )
      }}
    />
  )
}

export function FormSwitch({
  form,
  name,
  label,
  description,
  ...props
}: BaseFieldProps & Omit<ComponentProps<typeof Switch>, 'form'>) {
  return (
    <form.Field
      name={name}
      children={(field: any) => {
        const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
        return (
          <Field orientation="horizontal" data-invalid={isInvalid}>
            <FieldContent>
              {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
              {description && <FieldDescription>{description}</FieldDescription>}
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </FieldContent>
            <Switch
              id={field.name}
              name={field.name}
              checked={field.state.value}
              onCheckedChange={field.handleChange}
              aria-invalid={isInvalid}
              {...props}
            />
          </Field>
        )
      }}
    />
  )
}

interface FormSelectProps extends BaseFieldProps, Omit<ComponentProps<typeof Select>, 'name' | 'value' | 'onValueChange' | 'form'> {
  options: { label: string; value: string }[]
  placeholder?: string
}

export function FormSelect({
  form,
  name,
  label,
  description,
  options,
  placeholder = "Select",
  ...props
}: FormSelectProps) {
  return (
    <form.Field
      name={name}
      children={(field: any) => {
        const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
        return (
          <Field data-invalid={isInvalid}>
            {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
            <Select
              name={field.name}
              value={field.state.value}
              onValueChange={field.handleChange}
              {...props}
            >
              <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {description && <FieldDescription>{description}</FieldDescription>}
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        )
      }}
    />
  )
}
