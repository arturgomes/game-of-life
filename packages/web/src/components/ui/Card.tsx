import type { ReactNode } from "react";

type CardProps = {
	children: ReactNode;
	className?: string;
};

export function Card({ children, className = "" }: CardProps) {
	return (
		<div className={`bg-white rounded-lg shadow ${className}`}>{children}</div>
	);
}

type CardHeaderProps = {
	children: ReactNode;
};

export function CardHeader({ children }: CardHeaderProps) {
	return <div className="px-6 py-4 border-b border-gray-200">{children}</div>;
}

type CardTitleProps = {
	children: ReactNode;
};

export function CardTitle({ children }: CardTitleProps) {
	return <h3 className="text-lg font-semibold text-gray-900">{children}</h3>;
}

type CardBodyProps = {
	children: ReactNode;
};

export function CardBody({ children }: CardBodyProps) {
	return <div className="px-6 py-4">{children}</div>;
}

type CardFooterProps = {
	children: ReactNode;
};

export function CardFooter({ children }: CardFooterProps) {
	return (
		<div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
			{children}
		</div>
	);
}

// Compound pattern exports
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Body = CardBody;
Card.Footer = CardFooter;
