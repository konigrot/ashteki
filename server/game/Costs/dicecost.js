const Dice = require('../dice');

class DiceCost {
    constructor(properties) {
        this.diceReq = properties.diceReq;
        this.promptsPlayer = true;
    }

    canPay(context) {
        return Dice.canMatch(context.player.dice, this.getDiceReq(context));
    }

    // eslint-disable-next-line no-unused-vars
    getDiceReq(context) {
        return this.diceReq;
    }

    resolve(context, result) {
        const nonParallels = this.getDiceReq(context).filter((r) => !Array.isArray(r));
        const nonBasics = nonParallels.filter((r) => r.level !== 'basic');
        let chosenDice = Dice.matchDice(context.player.dice, nonBasics);
        if (chosenDice.length == Dice.getRequiredCount(this.getDiceReq(context))) {
            context.costs.returnDice = chosenDice;
            return true;
        }

        let promptPlayer = () => {
            let buttons = [];
            if (Dice.canMatch(chosenDice, this.getDiceReq(context))) {
                buttons.push({ text: 'Done', arg: 'done' });
            }
            if (result.canCancel) {
                buttons.push({ text: 'Cancel', arg: 'cancel' });
            }
            context.game.promptForDieSelect(context.player, {
                activePromptTitle: 'Select die',
                mode: 'match',
                selectedDice: [...chosenDice],
                context: context,
                buttons: buttons,
                format: this.getDiceReq(context),
                dieCondition: (d) => !d.exhausted && !chosenDice.includes(d),
                onSelect: (player, dice) => {
                    // EXACTLY returns an array SINGLE does not
                    chosenDice = chosenDice.concat(dice);
                    if (!Dice.canMatch(chosenDice, this.getDiceReq(context))) {
                        promptPlayer();
                    } else {
                        context.costs.returnDice = chosenDice;
                    }
                    return true;
                },
                onMenuCommand: (player, arg) => {
                    if (arg === 'done') {
                        context.costs.returnDice = chosenDice;
                        return true;
                    }
                },
                onCancel: () => {
                    context.costs.returnDice = [];
                    result.cancelled = true;
                }
            });
        };
        promptPlayer();
    }

    payEvent(context) {
        return context.game.actions
            .exhaustDie({ target: context.costs.returnDice })
            .getEventArray(context);
    }
}

module.exports = DiceCost;
