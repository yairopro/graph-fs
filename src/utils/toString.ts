const { isNil } = require("ramda");

export default function toString(path: any): string | undefined {
	if (!isNil(path))
		return String(path);
}