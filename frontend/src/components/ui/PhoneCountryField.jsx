import { Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { cn } from '@/lib/cn';
import { DEFAULT_COUNTRY_CODES, formatDial } from '@/lib/phone';

export function PhoneCountryField({
  id = 'phone',
  codes,
  countryName = 'countryCode',
  control,
  register,
  className,
}) {
  const list = codes?.length ? codes : DEFAULT_COUNTRY_CODES;
  const onlyOne = list.length === 1;

  return (
    <div className={cn('mt-1 flex', className)}>
      {onlyOne ? (
        <span className="flex h-10 shrink-0 items-center rounded-l-md border border-r-0 border-border bg-muted-bg px-3 text-sm tabular">
          {formatDial(list[0].dial)}
        </span>
      ) : (
        <Controller
          name={countryName}
          control={control}
          render={({ field }) => (
            <Select value={field.value || list[0]?.dial} onValueChange={field.onChange}>
              <SelectTrigger
                aria-label="Country code"
                className="h-10 w-[6.75rem] shrink-0 rounded-r-none border-r-0 px-2"
              >
                <span className="tabular">{formatDial(field.value || list[0]?.dial)}</span>
              </SelectTrigger>
              <SelectContent>
                {list.map((row) => (
                  <SelectItem key={row.dial} value={row.dial}>
                    {formatDial(row.dial)} {row.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      )}
      <Input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="98XXXXXXXX"
        className="rounded-l-none"
        {...register}
      />
    </div>
  );
}
