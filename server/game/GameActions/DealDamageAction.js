const CardGameAction = require('./CardGameAction');

class DealDamageAction extends CardGameAction {
    setDefaultProperties() {
        this.amount = null;
        this.amountForCard = () => 1;
        this.fightEvent = null;
        this.damageSource = null;
        this.damageType = 'card effect';
        this.splash = 0;
        this.purge = false;
        this.ignoreArmor = false;
        this.bonus = false;
    }

    setup() {
        this.targetType = ['Ally', 'Conjuration', 'Phoenixborn'];
        this.name = 'damage';
        this.effectMsg =
            'deal ' +
            (this.amount ? this.amount + ' ' : '') +
            'damage to {0}' +
            (this.splash ? ' and ' + this.splash + ' to their neighbors' : '');
    }

    canAffect(card, context) {
        if (this.amount === 0 || (!this.amount && this.amountForCard(card, context) === 0)) {
            return false;
        }

        return card.location === 'play area' && super.canAffect(card, context);
    }

    getEventArray(context) {
        if (this.splash) {
            return this.target
                .filter((card) => this.canAffect(card, context))
                .reduce(
                    (array, card) =>
                        array.concat(
                            this.getEvent(card, context),
                            card.neighbors.map((neighbor) =>
                                this.getEvent(neighbor, context, this.splash)
                            )
                        ),
                    []
                );
        }

        return super.getEventArray(context);
    }

    getEvent(card, context, amount = this.amount || this.amountForCard(card, context)) {
        const params = {
            card: card,
            context: context,
            amount: amount,
            damageSource: this.damageSource || context.source,
            damageType: this.damageType,
            destroyEvent: null,
            fightEvent: this.fightEvent,
            ignoreArmor: this.ignoreArmor,
            bonus: this.bonus
        };

        return super.createEvent('onDamageDealt', params, (damageDealtEvent) => {
            let damageAppliedParams = {
                amount: damageDealtEvent.amount,
                card: damageDealtEvent.card,
                context: damageDealtEvent.context,
                condition: (event) => event.amount > 0
            };
            let damageAppliedEvent = super.createEvent(
                'onDamageApplied',
                damageAppliedParams,
                (event) => {
                    event.noGameStateCheck = true;
                    event.card.addToken('damage', event.amount);
                    if (!event.card.moribund && event.card.tokens.damage >= event.card.life) {
                        damageDealtEvent.destroyEvent = context.game.actions
                            .destroy({ damageEvent: damageDealtEvent })
                            .getEvent(event.card, context.game.getFrameworkContext());

                        event.addSubEvent(damageDealtEvent.destroyEvent);
                        if (damageDealtEvent.fightEvent) {
                            damageDealtEvent.fightEvent.destroyed.push(event.card);
                        }
                    }
                }
            );

            if (damageDealtEvent.ignoreArmor) {
                damageDealtEvent.addSubEvent(damageAppliedEvent);
            } else {
                let armorPreventParams = {
                    card: damageDealtEvent.card,
                    context: damageDealtEvent.context,
                    amount: damageDealtEvent.amount,
                    noGameStateCheck: true
                };
                let armorPreventEvent = super.createEvent(
                    'onDamagePreventedByArmor',
                    armorPreventParams,
                    (event) => {
                        if (amount <= event.card.armor) {
                            event.damagePrevented = event.amount;
                        } else {
                            event.damagePrevented = event.card.armor;
                        }

                        damageAppliedEvent.amount -= event.damagePrevented;
                        damageDealtEvent.amount -= event.damagePrevented;
                        damageDealtEvent.addSubEvent(damageAppliedEvent);
                    }
                );
                damageDealtEvent.addSubEvent(armorPreventEvent);
                armorPreventEvent.openReactionWindow = true;
            }
        });
    }
}

module.exports = DealDamageAction;
