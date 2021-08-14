"use strict";
import { NewCodemarkCommandArgs } from "commands";
import {
	CancellationToken,
	CodeActionContext,
	CodeActionProvider,
	Command,
	Disposable,
	DocumentSelector,
	languages,
	Range,
	TextDocument
} from "vscode";
import { SessionStatus, SessionStatusChangedEvent } from "../api/session";
import { Container } from "../container";

export class CodeStreamCodeActionProvider implements CodeActionProvider, Disposable {
	static selector: DocumentSelector = [
		{ scheme: "file" },
		{ scheme: "untitled" },
		{ scheme: "vsls" }
	];

	private readonly _disposable: Disposable;
	private _disposableSignedIn: Disposable | undefined;

	constructor() {
		this._disposable = Disposable.from(
			Container.session.onDidChangeSessionStatus(this.onSessionStatusChanged, this)
		);
	}

	dispose() {
		this._disposable && this._disposable.dispose();
	}

	private async onSessionStatusChanged(e: SessionStatusChangedEvent) {
		const status = e.getStatus();
		switch (status) {
			case SessionStatus.SignedOut:
				this._disposableSignedIn && this._disposableSignedIn.dispose();
				break;

			case SessionStatus.SignedIn:
				this._disposableSignedIn = languages.registerCodeActionsProvider(
					CodeStreamCodeActionProvider.selector,
					this
				);
				break;
		}
	}
	// TODO: on settings change - if code actions disabled, dispose code actions.

	provideCodeActions(
		_document: TextDocument,
		range: Range,
		_context: CodeActionContext,
		_token: CancellationToken
	): Command[] | Thenable<Command[]> {
		if (!Container.session.signedIn || range.start.compareTo(range.end) === 0) return [];

		const args: NewCodemarkCommandArgs = { source: "Lightbulb Menu" };
		const commands: Command[] = [
			{
				title: "Add Comment",
				command: "codestream.newComment",
				arguments: [args]
			},
			{
				title: "Create Issue",
				command: "codestream.newIssue",
				arguments: [args]
			},
			// {
			// 	title: `Create Bookmark`,
			// 	command: "codestream.newBookmark",
			// 	arguments: [args]
			// },
			{
				title: "Get Permalink",
				command: "codestream.newPermalink",
				arguments: [args]
			}
			// {
			// 	title: "Request Feedback",
			// 	command: "codestream.newReview",
			// 	arguments: [args]
			// },
			// {
			// 	title: "Open a Pull Request",
			// 	command: "codestream.newPullRequest",
			// 	arguments: [args]
			// }
		];
		return commands;
	}
}
