import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
	label?: string;
	error?: string;
};

export function Input({ label, error, className = "", ...props }: InputProps) {
	return (
		<div className="w-full">
			<label className="block w-full">
				{label && (
					<span className="block text-sm font-medium text-gray-700 mb-1">
						{label}
					</span>
				)}
				<input
					className={`
          w-full px-3 py-2
          border border-gray-300 rounded-lg
          focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? "border-red-500 focus:ring-red-500" : ""}
          ${className}
        `}
					{...props}
				/>
			</label>
			{error && <p className="mt-1 text-sm text-red-600">{error}</p>}
		</div>
	);
}
